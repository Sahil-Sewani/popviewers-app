from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
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
    platforms = Column(Text, nullable=True)
    age_group = Column(String, nullable=True)
    hours_per_week = Column(String, nullable=True)
    devices = Column(Text, nullable=True)
    genres = Column(Text, nullable=True)

    buzz_score = Column(Integer, nullable=True)
    recommend = Column(String, nullable=True)
    standout_elements = Column(Text, nullable=True)
    talent_interest = Column(String, nullable=True)
    social_share = Column(String, nullable=True)

    one_word = Column(String, nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
