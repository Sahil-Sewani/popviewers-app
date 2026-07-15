import json
import os
from datetime import datetime, timedelta, timezone

import boto3

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

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

ADMIN_SECRET_NAME = os.getenv("ADMIN_SECRET_NAME", "popviewers/prod/admin")


def load_admin_secret():
    client = boto3.client("secretsmanager", region_name="us-east-1")
    response = client.get_secret_value(SecretId=ADMIN_SECRET_NAME)
    return json.loads(response["SecretString"])


_admin_secret_cache = None


def get_admin_secret():
    global _admin_secret_cache

    if _admin_secret_cache is None:
        _admin_secret_cache = load_admin_secret()

    return _admin_secret_cache

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 720

security = HTTPBearer()


class AdminLoginRequest(BaseModel):
    username: str
    password: str


def create_access_token(data: dict):
    admin_secret = get_admin_secret()
    jwt_secret_key = admin_secret["jwt_secret"]

    expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {**data, "exp": expires}
    return jwt.encode(payload, jwt_secret_key, algorithm=JWT_ALGORITHM)


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    admin_secret = get_admin_secret()
    admin_username = admin_secret["username"]
    jwt_secret_key = admin_secret["jwt_secret"]

    token = credentials.credentials

    try:
        payload = jwt.decode(token, jwt_secret_key, algorithms=[JWT_ALGORITHM])
        if payload.get("sub") != admin_username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return True


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


@app.post("/admin/login")
def admin_login(login: AdminLoginRequest):
    admin_secret = get_admin_secret()
    admin_username = admin_secret["username"]
    admin_password = admin_secret["password"]

    if login.username != admin_username or login.password != admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token({"sub": admin_username})

    return {"access_token": token, "token_type": "bearer"}


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
def create_response(
    response: SurveyResponseCreate,
    db: Session = Depends(get_db),
):
    try:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == response.campaign_id)
            .first()
        )

        if campaign is None:
            raise HTTPException(
                status_code=400,
                detail="The selected campaign is unavailable.",
            )

        title = (
            db.query(Title)
            .filter(
                Title.id == response.title_id,
                Title.campaign_id == response.campaign_id,
            )
            .first()
        )

        if title is None:
            raise HTTPException(
                status_code=400,
                detail="The selected title is unavailable.",
            )

        new_response = SurveyResponse(**response.model_dump())

        db.add(new_response)
        db.commit()
        db.refresh(new_response)

        return new_response

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="The response contains invalid campaign or title information.",
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="The response could not be saved. Please try again.",
        )


@app.get("/responses", response_model=list[SurveyResponseOut])
def list_responses(
    db: Session = Depends(get_db),
    admin: bool = Depends(require_admin),
):
    return db.query(SurveyResponse).order_by(SurveyResponse.id.desc()).all()