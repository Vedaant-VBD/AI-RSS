
# app/schemas.py - Pydantic Schemas for API validation
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "recruiter"

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['admin', 'hr_manager', 'recruiter', 'industry_specialist']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class JobDescriptionCreate(BaseModel):
    title: str
    description: str
    requirements: Dict[str, Any]
    keywords: List[str]
    experience_level: Optional[str] = None
    location: Optional[str] = None

class JobDescriptionResponse(BaseModel):
    id: UUID
    title: str
    description: str
    requirements: Dict[str, Any]
    keywords: List[str]
    experience_level: Optional[str]
    location: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    parsed_data: Optional[Dict[str, Any]]
    created_at: datetime

class AnalysisResponse(BaseModel):
    id: UUID
    resume_id: UUID
    match_percentage: float
    ai_summary: str
    strengths: List[str]
    gaps: List[str]
    keywords_matched: List[str]
    keywords_missing: List[str]
    experience_score: Optional[float]
    skills_score: Optional[float]
    education_score: Optional[float]
    created_at: datetime

class FilterRequest(BaseModel):
    min_match_percentage: Optional[float] = 0
    max_match_percentage: Optional[float] = 100
    experience_levels: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    education_levels: Optional[List[str]] = None
    locations: Optional[List[str]] = None
