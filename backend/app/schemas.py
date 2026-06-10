from typing import Optional

from pydantic import BaseModel


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
