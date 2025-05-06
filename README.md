# Career Craft

Career Craft is an AI-powered career development platform that analyzes resumes to extract technical skills, assess proficiency, and recommend personalized upskilling paths. The system combines resume parsing, local language models, and skill mapping to support early-career professionals targeting roles in data science, software engineering, product management, and related fields.

## Features

- Resume parsing and skill extraction from PDF and DOCX files
- Context-aware skill confidence scoring using a local LLM
- Mapping of technical skills to job-specific role requirements
- Career domain identification based on skill clusters
- Frontend dashboard for users to view their skill profile
- Optimized backend structure for modular expansion

## Project Structure

Career-Craft-Clean/
├── backend/
│ ├── main.py
│ ├── routers/
│ ├── caches/
│ ├── utils.py
│ ├── data.zip
│ ├── caches.zip
│ └── routers.zip
├── frontend/
│ ├── app/
│ ├── components/
│ └── app.zip
├── requirements.txt
├── .gitignore
└── README.md

bash
Copy
Edit

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SriLahariDwadasi/Career-Craft-Clean.git
cd Career-Craft-Clean
2. Extract Required Files
Unzip the compressed directories to restore the project structure:

bash
Copy
Edit
unzip backend/data.zip -d backend/
unzip backend/caches.zip -d backend/
unzip backend/routers.zip -d backend/
unzip frontend/app.zip -d frontend/
3. Backend Setup
Requires Python 3.10+

bash
Copy
Edit
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
4. Frontend Setup
Requires Node.js 18+

bash
Copy
Edit
cd ../frontend
npm install
npm run dev
Technology Stack
Backend: FastAPI, Python, Uvicorn

Frontend: Next.js, React, TailwindCSS

AI Components: Sentence Transformers, local LLM for skill evaluation

Data Sources: JSON skill graphs, resume examples

Dev Tools: GitHub, pip, npm

License
This project is licensed under the MIT License. See the LICENSE file for details.

Maintainer
Sri Lahari Dwadasi
Graduate Student, UC Berkeley
LinkedIn
