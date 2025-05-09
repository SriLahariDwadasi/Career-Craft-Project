# Career Craft

Career Craft is an AI-powered platform that analyzes resumes to extract technical skills, assess confidence levels, and recommend personalized upskilling paths. It uses local LLMs, semantic matching, and career domain mapping to support early-career professionals targeting data science, engineering, and product roles.

## AI System Workflow

![image](https://github.com/user-attachments/assets/a02bff51-5925-472e-ae82-dfb47be045f0)


## Features

- Resume parsing from PDF and DOCX formats
- Technical skill extraction using NLP and semantic matching
- Skill confidence scoring based on contextual relevance in resumes
- Mapping skills to job roles to analyze gaps and recommend learning paths
- Frontend dashboard for visualizing career fit and focus areas
- Modular, production-ready backend using FastAPI


## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SriLahariDwadasi/Career-Craft-Project.git
cd Career-Craft-Project
```

### 2. Backend Setup

Ensure Python 3.10+ is installed.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

Ensure Node.js 18+ is installed.

```bash
cd ../frontend
npm install
npm run dev
```

## Technology Stack

- **Backend**: FastAPI, Python, Uvicorn
- **Frontend**: Next.js, React, TailwindCSS
- **AI Components**: Sentence Transformers, Local LLMs
- **Data Sources**: CSV & JSON skill graph files, resume uploads
- **Dev Tools**: Git, pip, npm


## Maintainer

Sri Lahari Dwadasi  
Graduate Student, UC Berkeley  
[LinkedIn](https://www.linkedin.com/in/sri-lahari-dwadasi)
