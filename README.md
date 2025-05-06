# Career-Craft

## Our project builds a personalized career learning roadmap system that helps users transition into their dream job. Users begin by uploading their resume and selecting a target job title. The system analyzes their current skill set, identifies skill gaps using job-specific knowledge graphs, and recommends targeted skills with focus and confidence scores. Based on this, we curate learning modules with relevant online resources and generate a weekly schedule tailored to the user's availability. The platform supports continuous progress tracking and dynamic updates as the user advances. Ultimately, we aim to bridge the gap between career aspirations and actionable learning paths through intelligent planning and personalized guidance.

## 1. clone project
git clone (http link here)

cd 243-Career-Roadmap

## 2️. Create a Separate Branch (Recommended)
git checkout -b (your branch name)

## 3️. Set Up the Backend (FastAPI) navigate to backend folder in terminal
cd backend

python -m venv venv

## 4. Activate the Virtual Environment
Windows:
venv\Scripts\activate

Mac/Linux:
source venv/bin/activate

## 5. Install Backend Dependencies
pip install -r requirements.txt

## 6. Create .env File for Backend and paste api keys
touch .env (not needed now)

## ✅ Backend is now set up!

## 7. start backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000

## 8. Set Up the Frontend (Next.js) navigate to frontend folder in terminal
cd frontend

npm install

touch .env.local (not needed now)

## ✅ Frontend is now set up!

## 9. start frontend
npm run dev
