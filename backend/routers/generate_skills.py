import time
import traceback
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User_Goal, Learn_Skill
import requests
from dotenv import load_dotenv
import os

# Helpers
from utils.skill_extractor_helper.calculate_skill_importance import calculate_skill_importance
from utils.skill_extractor_helper.goal_skill_extractor import extractGoalSkills
from utils.skill_extractor_helper.resume_skill_extractor import analyze_resume_file

router = APIRouter(tags=["Generate Skills"])


# Load environment variables
load_dotenv()

SPACE_URL = os.getenv("SPACE_URL")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
UPLOAD_DIR = "data/uploaded_resumes"
ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"]

class GenerateSkillsRequest(BaseModel):
    user_id: int

def calculateFocus(job_skill_scores, resume_skill_scores):
    if len(job_skill_scores) != len(resume_skill_scores):
        raise IndexError(
            f"Job scores and resume scores do not match: "
            f"{len(job_skill_scores)} vs {len(resume_skill_scores)}"
        )

    # --- Step 0: Shift job scores so max → 100 ---
    max_job = max(score for _, score in job_skill_scores)
    shift = 100 - max_job if max_job < 100 else 0
    shifted_job = [[skill, score + shift] for skill, score in job_skill_scores]

    # Step 1: Normalize job and resume scores to [0, 1]
    normalized_job = [[s[0], s[1] / 100.0] for s in shifted_job]
    normalized_resume = [[s[0], s[1] / 100.0] for s in resume_skill_scores]

    # Step 2: Compute gaps (only where resume < job)
    gaps = []
    for i in range(len(normalized_job)):
        skill_name  = normalized_job[i][0]
        job_score   = normalized_job[i][1]
        resume_score= normalized_resume[i][1]

        if resume_score < job_score:
            gap = job_score - resume_score
            gaps.append([skill_name, gap, resume_score])

    if not gaps:
        return []

    # Step 3: Normalize gaps → focus_scores
    total_gap = sum(g[1] for g in gaps)
    for g in gaps:
        g[1] = round(g[1] / total_gap, 2)

    # Step 4: Normalize resume confidence scores
    total_conf = sum(g[2] for g in gaps)
    for g in gaps:
        g[2] = round(g[2] / total_conf, 2) if total_conf > 0 else 0.0

    return gaps


@router.post("/")
def generate_skills(req: GenerateSkillsRequest, db: Session = Depends(get_db)):
    try:
        # 1. Load user goal
        goal = db.query(User_Goal).filter(User_Goal.user_id == req.user_id).first()
        if not goal:
            raise HTTPException(status_code=404, detail="User goal not found")
        target_position = goal.target_position
        responsibility = goal.responsibility
        industry = goal.industry
        seniority_level = goal.exp_level

        print("------------------------------job skill extract begin------------------")
        start_time = time.time()
        print(f"target_position: {target_position}\n seniority_level: {seniority_level}\n industry(as part of responsibility): {industry}\n responsibility: {responsibility}")
        job_skills = extractGoalSkills(SPACE_URL, target_position, seniority_level, industry, responsibility)
        # print(f"llm output: {job_skills}")
        job_skill_scores = calculate_skill_importance(job_skills, target_position, seniority_level)
        print(f"job skill scores: {job_skill_scores}")
        
        end_time = time.time()
        print(f"Execution time: {end_time - start_time:.4f} seconds")
        print("------------------------------job skill extract finished---------------------")

        user_dir = os.path.join(UPLOAD_DIR, str(req.user_id))
        resume_path = None
        file_type = None
        for ext in ALLOWED_EXTENSIONS:
            path = os.path.join(user_dir, f"resume{ext}")
            if os.path.exists(path):
                resume_path = path
                file_type = ext[1:]
        
        job_skill_list = [tuple[0] for tuple in job_skill_scores]
        
        if os.path.exists(resume_path) and file_type:
            print("------------------------------resume skill extract begin---------------------------")
            start_time = time.time()

            resume_output = analyze_resume_file(resume_path, file_type, job_skill_list, GEMINI_KEY)
            
            end_time = time.time()
            print(f"Execution time: {end_time - start_time:.4f} seconds")
            print("------------------------------resume skill extract finished---------------------------")
        else:
            raise FileNotFoundError(f"Resume file not found for user: {req.user_id}")
        
        resume_skill_scores = []
        for (skill_name, importance) in job_skill_scores:
            found = False
            for (name, confidence) in resume_output:
                if skill_name == name:
                    resume_skill_scores.append((skill_name, confidence))
                    found = True
                    break
            if not found:
                resume_skill_scores.append((skill_name, 0))
        print(resume_skill_scores,"---------------------")
        normalized_skills = calculateFocus(job_skill_scores, resume_skill_scores)

        db.query(Learn_Skill).filter(Learn_Skill.user_id == req.user_id).delete()

        for skill in normalized_skills:
            db.add(Learn_Skill(
                user_id=req.user_id,
                skill_name=skill[0],
                focus_score=skill[1],
                confidence_score=skill[2]
            ))

        db.commit()
        
        return {"message": f"Generated {len(normalized_skills)} skills for user {req.user_id}", "skills": normalized_skills}

    except Exception as e:
        db.rollback()
        print("🔥 Exception occurred:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))