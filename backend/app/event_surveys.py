"""Published event surveys are immutable; edits create a new version."""

from typing import Literal, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Campaign, EventSurveyAnswer, EventSurveyVersion, SurveyResponse, Title
from app.schemas import SurveyResponseCreate


class Question(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(pattern=r"^[a-z][a-z0-9_]{0,63}$")
    label: str = Field(min_length=1, max_length=500)
    kind: Literal["text", "long_text", "single", "multiple", "rating"]
    required: bool = False
    options: list[str] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def valid_options(self):
        self.options = [option.strip() for option in self.options]
        if self.kind in ("single", "multiple"):
            if len(self.options) < 2 or any(not x or len(x) > 200 for x in self.options):
                raise ValueError("Choice questions need 2-30 nonempty choices, up to 200 characters each")
            if len(set(self.options)) != len(self.options):
                raise ValueError("Answer choices must be unique")
        elif self.options:
            raise ValueError("Only choice questions may have options")
        return self


class SurveyTitle(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: Optional[int] = Field(default=None, gt=0)
    name: str = Field(min_length=1, max_length=200)
    type: str = Field(default="", max_length=100)


class Definition(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=200)
    introduction: str = Field(default="Share your thoughts on the screening.", max_length=2000)
    titles: list[SurveyTitle] = Field(min_length=1, max_length=50)
    questions: list[Question] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def unique_ids(self):
        ids = [q.id for q in self.questions]
        reserved = {"first_name", "last_name", "email", "phone", "instagram", "campaign_id", "title_id"}
        if len(ids) != len(set(ids)) or reserved.intersection(ids):
            raise ValueError("Question IDs must be unique and cannot replace contact fields")
        title_ids = [t.id for t in self.titles if t.id is not None]
        if len(title_ids) != len(set(title_ids)):
            raise ValueError("Title IDs must be unique")
        return self


class PublishRequest(BaseModel):
    base_version_id: Optional[int] = None
    definition: Definition


class Submission(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    version_id: int
    title_id: int
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=1, max_length=254)
    phone: Optional[str] = Field(default=None, max_length=50)
    instagram: Optional[str] = Field(default=None, max_length=100)
    answers: dict[str, Union[str, int, list[str]]]


def default_questions():
    def q(id, label, kind="single", options=None, required=False):
        return dict(id=id, label=label, kind=kind, options=options or [], required=required)
    likelihood = ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"]
    return [
        q("discovery_sources", "How did you hear about this event?", "multiple", ["Social media", "Friends & family", "PopViewers", "Other"]),
        q("attendance_reason", "What brought you to this event?", options=["The title", "The cast", "Friends & family", "Discovering something new"]),
        q("title_familiarity", "How familiar were you with this title?", options=["Very familiar", "Somewhat familiar", "Not familiar"]),
        q("platforms", "Which platforms do you use?", "multiple", ["Netflix", "Hulu", "Prime Video", "Disney+", "Max", "Apple TV+", "STARZ", "Other"]),
        q("age_group", "Age range", options=["18-24", "25-34", "35-44", "45+"]),
        q("hours_per_week", "Hours watched or listened per week", options=["Less than 5", "5-10", "10-20", "20+"]),
        q("devices", "Where do you usually watch or listen?", "multiple", ["TV", "Laptop", "Phone", "Tablet", "In transit", "Audio-first"]),
        q("genres", "What genres pull you in?", "multiple", ["Drama", "Comedy", "Thriller", "Romance", "Action", "Sci-Fi", "Docuseries", "Reality"]),
        q("buzz_score", "How excited are you about this title?", "rating", required=True),
        q("recommend", "Would you recommend it?", options=["Yes", "Not sure", "No"], required=True),
        q("continue_watching", "Will you continue watching?", options=likelihood),
        q("standout_elements", "What stood out most?", "multiple", ["Story", "Acting", "Characters", "Ending", "Visuals", "Humor", "Action", "Emotional impact", "Music / sound"]),
        q("talent_interest", "Whose involvement excites you most?", options=["Lead actor", "Creator / showrunner", "Director", "Host / curator"]),
        q("social_share", "How likely are you to post about it?", options=["Very likely", "Somewhat likely", "Not likely"]),
        q("one_word", "One word to describe it", "text", required=True),
        q("live_audience_experience", "How did watching with a live audience affect your experience?", options=["Much more enjoyable", "Slightly more enjoyable", "No difference", "Less enjoyable"]),
        q("comments", "Anything else we should know?", "long_text"),
    ]


def latest(db, campaign_id):
    return db.query(EventSurveyVersion).filter_by(campaign_id=campaign_id).order_by(EventSurveyVersion.id.desc()).first()


def validate_answers(definition, answers):
    questions = {q["id"]: q for q in definition["questions"]}
    if set(answers) - questions.keys():
        raise HTTPException(422, "Unknown question")
    for key, question in questions.items():
        value = answers.get(key)
        empty = value is None or value == [] or (isinstance(value, str) and not value.strip())
        if empty:
            if question["required"]:
                raise HTTPException(422, f'Answer required: {question["label"]}')
            continue
        kind = question["kind"]
        valid = False
        if kind in ("text", "long_text"):
            valid = isinstance(value, str) and len(value) <= 5000
        elif kind == "single":
            valid = isinstance(value, str) and value in question["options"]
        elif kind == "multiple":
            valid = isinstance(value, list) and len(value) == len(set(value)) and all(v in question["options"] for v in value)
        elif kind == "rating":
            valid = type(value) is int and 1 <= value <= 10
        if not valid:
            raise HTTPException(422, f'Invalid answer: {question["label"]}')


def make_router(require_admin):
    router = APIRouter()

    @router.get("/event-surveys")
    def list_published(db: Session = Depends(get_db)):
        campaigns = db.query(Campaign).filter_by(active=True).order_by(Campaign.id.desc()).all()
        return [dict(campaign_id=c.id, name=v.definition["name"]) for c in campaigns if (v := latest(db, c.id))]

    @router.get("/event-surveys/{campaign_id}")
    def read_published(campaign_id: int, db: Session = Depends(get_db)):
        campaign = db.get(Campaign, campaign_id)
        version = latest(db, campaign_id)
        if not campaign or not campaign.active or not version:
            raise HTTPException(404, "This event is not accepting responses")
        return dict(campaign_id=campaign_id, version_id=version.id, definition=version.definition)

    @router.get("/admin/events/{campaign_id}/survey", dependencies=[Depends(require_admin)])
    def read_editor(campaign_id: int, db: Session = Depends(get_db)):
        campaign = db.get(Campaign, campaign_id)
        if not campaign:
            raise HTTPException(404, "Event not found")
        version = latest(db, campaign_id)
        titles = db.query(Title).filter_by(campaign_id=campaign_id).order_by(Title.id).all()
        definition = version.definition if version else dict(
            name=campaign.name, introduction="Share your thoughts on the screening.",
            titles=[dict(id=t.id, name=t.name, type=t.type or "") for t in titles], questions=default_questions())
        return dict(version_id=version.id if version else None, definition=definition)

    @router.put("/admin/events/{campaign_id}/survey", dependencies=[Depends(require_admin)])
    def publish(campaign_id: int, request: PublishRequest, db: Session = Depends(get_db)):
        # Serialize publishers for an event on PostgreSQL, then reject stale editor copies.
        campaign = db.query(Campaign).filter_by(id=campaign_id).with_for_update().first()
        if not campaign:
            raise HTTPException(404, "Event not found")
        previous = latest(db, campaign_id)
        if request.base_version_id != (previous.id if previous else None):
            raise HTTPException(409, "This event changed. Reload the editor before publishing.")
        definition = request.definition.model_dump()
        for entry in definition["titles"]:
            title = db.get(Title, entry["id"]) if entry["id"] else None
            if entry["id"] and (not title or title.campaign_id != campaign_id):
                raise HTTPException(422, "Title does not belong to this event")
            # Renaming creates a new title so legacy responses keep their original name.
            if not title or title.name != entry["name"] or (title.type or "") != entry["type"]:
                title = Title(campaign_id=campaign_id)
                db.add(title)
            title.name, title.type = entry["name"], entry["type"]
            db.flush()
            entry["id"] = title.id
        version = EventSurveyVersion(campaign_id=campaign_id, definition=definition)
        db.add(version)
        db.commit()
        db.refresh(version)
        return dict(version_id=version.id, definition=version.definition)

    @router.post("/event-responses", status_code=201)
    def submit(request: Submission, db: Session = Depends(get_db)):
        version = db.get(EventSurveyVersion, request.version_id)
        campaign = db.get(Campaign, version.campaign_id) if version else None
        if not campaign or not campaign.active:
            raise HTTPException(404, "This event is not accepting responses")
        title = next((t for t in version.definition["titles"] if t["id"] == request.title_id), None)
        if not title:
            raise HTTPException(422, "Select a title from this survey")
        validate_answers(version.definition, request.answers)
        from pydantic import ValidationError
        try:
            contact = SurveyResponseCreate(
                campaign_id=campaign.id,
                title_id=request.title_id,
                first_name=request.first_name,
                last_name=request.last_name,
                email=request.email,
                phone=request.phone,
                instagram=request.instagram,
            )
        except ValidationError:
            raise HTTPException(422, "Enter a valid email address")
        values = contact.model_dump()
        for key, value in request.answers.items():
            if key in values:
                if key == "buzz_score":
                    values[key] = value if type(value) is int else None
                else:
                    values[key] = ", ".join(value) if isinstance(value, list) else str(value)
        response = SurveyResponse(**values)
        db.add(response)
        db.flush()
        db.add(EventSurveyAnswer(response_id=response.id, version_id=version.id,
            answers=request.answers, title_name=title["name"]))
        db.commit()
        return {"id": response.id}

    return router
