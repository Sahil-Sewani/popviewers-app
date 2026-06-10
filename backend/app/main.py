from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Campaign
from app.schemas import CampaignCreate, CampaignOut

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PopViewers API")


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
