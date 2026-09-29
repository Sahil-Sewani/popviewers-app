from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.sql import func

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    event_date = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Title(Base):
    __tablename__ = "titles"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SurveyResponse(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)

    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=True)

    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    discovery_sources = Column(Text, nullable=True)
    attendance_reason = Column(String, nullable=True)
    title_familiarity = Column(String, nullable=True)
    platforms = Column(Text, nullable=True)
    starz_subscriber = Column(String, nullable=True)
    starz_subscription_interest = Column(String, nullable=True)
    age_group = Column(String, nullable=True)
    hours_per_week = Column(String, nullable=True)
    devices = Column(Text, nullable=True)
    genres = Column(Text, nullable=True)

    buzz_score = Column(Integer, nullable=True)
    recommend = Column(String, nullable=True)
    continue_watching = Column(String, nullable=True)
    standout_elements = Column(Text, nullable=True)
    talent_interest = Column(String, nullable=True)
    social_share = Column(String, nullable=True)

    one_word = Column(String, nullable=True)
    live_audience_experience = Column(String, nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventSurveyVersion(Base):
    __tablename__ = "event_survey_versions"

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    definition = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventSurveyAnswer(Base):
    __tablename__ = "event_survey_answers"

    response_id = Column(Integer, ForeignKey("responses.id"), primary_key=True)
    version_id = Column(Integer, ForeignKey("event_survey_versions.id"), nullable=False)
    answers = Column(JSON, nullable=False)
    title_name = Column(String, nullable=False)
