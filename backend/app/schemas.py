from typing import Optional

from pydantic import BaseModel, EmailStr


class CampaignCreate(BaseModel):
    name: str
    event_date: Optional[str] = None
    active: bool = True


class CampaignOut(BaseModel):
    id: int
    name: str
    event_date: Optional[str]
    active: bool

    model_config = {
        "from_attributes": True
    }


class TitleCreate(BaseModel):
    campaign_id: int
    name: str
    type: Optional[str] = None


class TitleOut(BaseModel):
    id: int
    campaign_id: int
    name: str
    type: Optional[str]

    model_config = {
        "from_attributes": True
    }


class SurveyResponseCreate(BaseModel):
    campaign_id: int
    title_id: Optional[int] = None

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    instagram: Optional[str] = None
    phone: Optional[str] = None

    discovery_sources: Optional[str] = None
    platforms: Optional[str] = None
    age_group: Optional[str] = None
    hours_per_week: Optional[str] = None
    devices: Optional[str] = None
    genres: Optional[str] = None

    buzz_score: Optional[int] = None
    recommend: Optional[str] = None
    standout_elements: Optional[str] = None
    talent_interest: Optional[str] = None
    social_share: Optional[str] = None

    one_word: Optional[str] = None
    comments: Optional[str] = None


class SurveyResponseOut(SurveyResponseCreate):
    id: int

    model_config = {
        "from_attributes": True
    }
