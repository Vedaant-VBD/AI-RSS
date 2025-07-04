
# app/models.py - SQLAlchemy Models
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, DECIMAL, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="recruiter")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSONB, nullable=False)
    keywords = Column(ARRAY(String))
    experience_level = Column(String(50))
    location = Column(String(255))
    created_by = Column(UUID(as_uuid=True), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_hash = Column(String(64), nullable=False)
    parsed_data = Column(JSONB)
    upload_session_id = Column(UUID(as_uuid=True))
    uploaded_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), nullable=False)
    job_description_id = Column(UUID(as_uuid=True), nullable=False)
    match_percentage = Column(DECIMAL(5,2), nullable=False)
    ai_summary = Column(Text, nullable=False)
    strengths = Column(ARRAY(String))
    gaps = Column(ARRAY(String))
    keywords_matched = Column(ARRAY(String))
    keywords_missing = Column(ARRAY(String))
    experience_score = Column(DECIMAL(3,2))
    skills_score = Column(DECIMAL(3,2))
    education_score = Column(DECIMAL(3,2))
    analysis_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
