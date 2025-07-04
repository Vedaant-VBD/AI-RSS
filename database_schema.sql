
-- Resume Sorting & AI Summarization Application Database Schema
-- PostgreSQL Implementation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'recruiter' CHECK (role IN ('admin', 'hr_manager', 'recruiter', 'industry_specialist')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job descriptions table
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB NOT NULL, -- Store structured requirements
    keywords TEXT[], -- Array of keywords for matching
    experience_level VARCHAR(50),
    location VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resumes table for storing uploaded resume files and parsed data
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for duplicate detection
    parsed_data JSONB, -- Store extracted resume data
    upload_session_id UUID, -- For batch uploads
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume analysis table for storing AI analysis results
CREATE TABLE resume_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    match_percentage DECIMAL(5,2) NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
    ai_summary TEXT NOT NULL,
    strengths TEXT[],
    gaps TEXT[],
    keywords_matched TEXT[],
    keywords_missing TEXT[],
    experience_score DECIMAL(3,2),
    skills_score DECIMAL(3,2),
    education_score DECIMAL(3,2),
    analysis_metadata JSONB, -- Store additional AI analysis data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Filters table for saved filter configurations
CREATE TABLE saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filter_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_resumes_upload_session ON resumes(upload_session_id);
CREATE INDEX idx_resumes_uploaded_by ON resumes(uploaded_by);
CREATE INDEX idx_resume_analysis_resume_id ON resume_analysis(resume_id);
CREATE INDEX idx_resume_analysis_job_id ON resume_analysis(job_description_id);
CREATE INDEX idx_resume_analysis_match_percentage ON resume_analysis(match_percentage DESC);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_job_descriptions_created_by ON job_descriptions(created_by);
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);

-- Create full-text search indexes
CREATE INDEX idx_resumes_parsed_data_gin ON resumes USING GIN (parsed_data);
CREATE INDEX idx_job_descriptions_requirements_gin ON job_descriptions USING GIN (requirements);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion
INSERT INTO users (email, name, password_hash, role) VALUES 
('admin@example.com', 'System Admin', '$2b$12$example_hash', 'admin'),
('hr@example.com', 'HR Manager', '$2b$12$example_hash', 'hr_manager'),
('recruiter@example.com', 'Senior Recruiter', '$2b$12$example_hash', 'recruiter');

