from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, get_db
from app.models import Campaign, SurveyResponse, Title
from app.schemas import (
    CampaignCreate,
    CampaignOut,
    SurveyResponseCreate,
    SurveyResponseOut,
    TitleCreate,
    TitleOut,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PopViewers API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://app.popviewers.com",
        "https://d2yurbx4ar0mmg.cloudfront.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "PopViewers API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/campaigns", response_model=CampaignOut)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    new_campaign = Campaign(
        name=campaign.name,
        event_date=campaign.event_date,
        active=campaign.active,
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    return new_campaign


@app.get("/campaigns", response_model=list[CampaignOut])
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).order_by(Campaign.id.desc()).all()


@app.post("/titles", response_model=TitleOut)
def create_title(title: TitleCreate, db: Session = Depends(get_db)):
    new_title = Title(
        campaign_id=title.campaign_id,
        name=title.name,
        type=title.type,
    )

    db.add(new_title)
    db.commit()
    db.refresh(new_title)

    return new_title


@app.get("/titles", response_model=list[TitleOut])
def list_titles(db: Session = Depends(get_db)):
    return db.query(Title).order_by(Title.id.desc()).all()


@app.post("/responses", response_model=SurveyResponseOut)
def create_response(response: SurveyResponseCreate, db: Session = Depends(get_db)):
    new_response = SurveyResponse(**response.model_dump())

    db.add(new_response)
    db.commit()
    db.refresh(new_response)

    return new_response


@app.get("/responses", response_model=list[SurveyResponseOut])
def list_responses(db: Session = Depends(get_db)):
    return db.query(SurveyResponse).order_by(SurveyResponse.id.desc()).all()
