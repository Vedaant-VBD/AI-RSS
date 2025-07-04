# Resume Sorting & AI Summarization Web Application - Project Setup Guide

## 📋 Project Overview

This comprehensive guide will help you build a sophisticated web application that sorts resumes in descending order of their match percentage using ATS-based algorithms and AI-powered summarization.

### 🎯 Key Features
- **Batch PDF Resume Upload**: Support for uploading up to 5000 resumes
- **ATS-Based Matching**: Advanced algorithms to calculate match percentages
- **AI-Powered Summarization**: 4-5 line summaries highlighting strengths, gaps, and key qualifications
- **Advanced Filtering System**: Customizable filters for HR professionals
- **Real-time Sorting**: Dynamic sorting by match percentage
- **Role-Based Access Control**: Support for HR managers, recruiters, and industry specialists
- **Secure File Handling**: Enterprise-grade security for sensitive resume data

## 🏗️ System Architecture

### Technology Stack

**Backend:**
- **Framework**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL with JSONB support
- **Authentication**: JWT-based stateless authentication
- **AI Service**: OpenAI API for resume analysis
- **File Processing**: PyPDF2 + pyresparser
- **Testing**: pytest with async support
- **Caching**: Redis for improved performance

**Frontend:**
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: React with modern hooks
- **State Management**: React Query + Zustand
- **Styling**: Tailwind CSS
- **File Upload**: react-dropzone with drag & drop

**Infrastructure:**
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL 15
- **Caching**: Redis 7

## 📁 Project Structure

```
resume-analyzer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # Database configuration
│   │   ├── auth.py              # Authentication logic
│   │   ├── resume_processor.py  # Resume parsing logic
│   │   ├── ai_analyzer.py       # OpenAI integration
│   │   ├── ats_matcher.py       # ATS matching algorithms
│   │   └── utils.py             # Utility functions
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Test files
│   ├── uploads/                 # Resume file storage
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend container
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app directory
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utility libraries
│   │   ├── types/               # TypeScript types
│   │   └── styles/              # CSS styles
│   ├── public/                  # Static assets
│   ├── package.json             # Node.js dependencies
│   └── Dockerfile               # Frontend container
├── database/
│   └── schema.sql               # Database schema
├── nginx/
│   └── nginx.conf               # Nginx configuration
├── docker-compose.yml           # Container orchestration
├── .env.example                 # Environment variables template
└── README.md                    # Project documentation
```

## 🚀 Quick Start Guide

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js 18+ (for local frontend development)
- Python 3.9+ (for local backend development)
- OpenAI API key

### Step 1: Environment Setup

1. **Clone the project structure:**
```bash
mkdir resume-analyzer && cd resume-analyzer
mkdir -p backend/app frontend/src database nginx
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration:
# - OpenAI API key
# - JWT secret key
# - Database credentials
```

### Step 2: Database Setup

1. **Create the database schema:**
```bash
# Use the provided database_schema.sql file
cp database_schema.sql database/
```

2. **Start PostgreSQL:**
```bash
docker-compose up postgres -d
```

### Step 3: Backend Development

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Set up the FastAPI application:**
```bash
# Copy the provided FastAPI files:
# - fastapi_main.py → app/main.py
# - sqlalchemy_models.py → app/models.py  
# - pydantic_schemas.py → app/schemas.py
```

3. **Create additional backend modules:**

**app/database.py:**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**app/resume_processor.py:**
```python
import PyPDF2
from pyresparser import ResumeParser
import hashlib
import uuid
from typing import Dict, Any

class ResumeProcessor:
    async def process_resume(self, file, user_id: str) -> Dict[str, Any]:
        # Extract text from PDF
        # Parse resume data
        # Generate content hash
        # Store file and return parsed data
        pass
```

**app/ai_analyzer.py:**
```python
import openai
from typing import List, Dict, Any

class AIAnalyzer:
    def __init__(self):
        openai.api_key = os.getenv("OPENAI_API_KEY")
    
    async def analyze_batch(self, job_id: str, resume_ids: List[str], db) -> List[Dict[str, Any]]:
        # Analyze resumes against job description
        # Generate match percentages
        # Create AI summaries
        # Return analysis results
        pass
```

### Step 4: Frontend Development

1. **Initialize Next.js project:**
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app-dir
```

2. **Install additional dependencies:**
```bash
npm install react-query zustand react-dropzone axios
npm install -D @types/react @types/node
```

3. **Create key components:**

**src/components/ResumeUpload.tsx:**
```typescript
import React from 'react';
import { useDropzone } from 'react-dropzone';

interface ResumeUploadProps {
  onUpload: (files: File[]) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUpload }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: onUpload,
    multiple: true
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the PDF files here...</p>
      ) : (
        <p>Drag & drop PDF files here, or click to select files</p>
      )}
    </div>
  );
};
```

### Step 5: Integration & Testing

1. **Run the complete stack:**
```bash
docker-compose up -d
```

2. **Test API endpoints:**
```bash
# Run backend tests
cd backend && pytest

# Test API manually
curl http://localhost:8000/docs
```

3. **Test frontend:**
```bash
# Access the application
open http://localhost:3000
```

## 🔧 Development Workflow

### Backend Development
1. **API Endpoint Development:**
   - Use FastAPI's automatic documentation
   - Implement proper error handling
   - Add request/response validation

2. **Database Operations:**
   - Use SQLAlchemy ORM for database operations
   - Implement proper indexing for performance
   - Handle concurrent operations safely

3. **AI Integration:**
   - Implement rate limiting for OpenAI API
   - Handle API errors gracefully
   - Cache results when appropriate

### Frontend Development
1. **Component Architecture:**
   - Use React hooks for state management
   - Implement proper TypeScript types
   - Create reusable UI components

2. **State Management:**
   - Use React Query for server state
   - Use Zustand for client state
   - Implement optimistic updates

3. **User Experience:**
   - Add loading states and error handling
   - Implement real-time updates
   - Ensure responsive design

## 📊 Key Implementation Details

### Resume Processing Pipeline
1. **File Upload:** Validate PDF files, check for duplicates
2. **Text Extraction:** Use PyPDF2 to extract text content
3. **Data Parsing:** Extract structured data (name, skills, experience)
4. **Storage:** Store files securely with metadata

### AI Analysis Workflow
1. **Job Matching:** Compare resume content with job requirements
2. **Scoring:** Calculate match percentage using weighted criteria
3. **Summarization:** Generate 4-5 line summaries with strengths/gaps
4. **Ranking:** Sort results by match percentage

### Security Considerations
1. **File Upload Security:**
   - Validate file types and sizes
   - Scan for malicious content
   - Store files outside web root

2. **Authentication:**
   - JWT token-based authentication
   - Role-based access control
   - Secure password hashing

3. **Data Protection:**
   - Encrypt sensitive data
   - Implement audit logging
   - GDPR compliance considerations

## 🚀 Deployment Guide

### Production Deployment
1. **Environment Setup:**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure domain names

2. **Database Setup:**
   - Use managed PostgreSQL service
   - Configure backups and monitoring
   - Set up read replicas if needed

3. **Application Deployment:**
   - Use Docker Swarm or Kubernetes
   - Implement health checks
   - Configure auto-scaling

### Monitoring & Maintenance
1. **Application Monitoring:**
   - Set up logging and metrics
   - Configure alerts for errors
   - Monitor API performance

2. **Database Monitoring:**
   - Track query performance
   - Monitor storage usage
   - Set up automated backups

## 🧪 Testing Strategy

### Backend Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test types
pytest tests/test_api.py
pytest tests/test_resume_processing.py
```

### Frontend Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📈 Performance Optimization

### Backend Optimization
- Implement database query optimization
- Use connection pooling
- Add Redis caching for frequent queries
- Implement async processing for large batches

### Frontend Optimization
- Use Next.js automatic code splitting
- Implement lazy loading for components
- Optimize bundle size
- Use service workers for caching

## 🔍 Troubleshooting Guide

### Common Issues
1. **Database Connection Errors:**
   - Check PostgreSQL service status
   - Verify connection string
   - Check firewall settings

2. **File Upload Issues:**
   - Verify file size limits
   - Check disk space
   - Validate file permissions

3. **AI Analysis Errors:**
   - Check OpenAI API key
   - Monitor rate limits
   - Handle API timeouts

### Performance Issues
1. **Slow Database Queries:**
   - Add appropriate indexes
   - Optimize query structure
   - Use database query analyzer

2. **Large File Processing:**
   - Implement chunked processing
   - Use background tasks
   - Add progress indicators

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branches
3. Follow coding standards
4. Add comprehensive tests
5. Submit pull requests

## 📞 Support

For questions and support:
- Check the troubleshooting guide
- Review the API documentation
- Create an issue in the repository
- Contact the development team

---

**Note:** This guide provides a comprehensive foundation for building the resume sorting and AI summarization application. Customize the implementation based on your specific requirements and infrastructure constraints.