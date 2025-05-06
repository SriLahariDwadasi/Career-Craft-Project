import json
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User_Goal
from pydantic import BaseModel
from typing import Optional
from caches.goal_cache import (
    get_cached_user_goal,
    cache_user_goal,
    clear_user_goal_cache,
    clear_all_user_goal_cache,
)

UPLOAD_DIR = "./data/uploaded_resumes"


router = APIRouter(tags=["User Goal"])


# ✅ Request Model
class GoalRequest(BaseModel):
    target_position: str
    industry: str
    exp_level: str
    duration_weeks: int
    weekly_hours: int
    isMonday: bool
    isTuesday: bool
    isWednesday: bool
    isThursday: bool
    isFriday: bool
    isSaturday: bool
    isSunday: bool
    responsibility: Optional[str]


# ✅ Fetch User Goal
@router.get("/{user_id}/")
def get_user_goal(user_id: int, db: Session = Depends(get_db)):
    cached = get_cached_user_goal(user_id)
    if cached:
        goal = jsonable_encoder(cached)
        return goal
    
    goal = db.query(User_Goal).filter(User_Goal.user_id == user_id).first()
    if not goal:
        return None
    cache_user_goal(user_id, goal)
    return goal


# ✅ Update or Create User Goal
@router.post("/{user_id}/")
def update_user_goal(user_id: int, request: GoalRequest, db: Session = Depends(get_db)):
    goal = db.query(User_Goal).filter(User_Goal.user_id == user_id).first()
    if goal:
        for field, value in request.model_dump().items():
            setattr(goal, field, value)
    else:
        goal = User_Goal(user_id=user_id, **request.model_dump())
        db.add(goal)

    db.commit()
    # ✅ Refresh cache after DB commit
    cache_user_goal(user_id, goal)

    return {"message": "User goal updated successfully!"}
from fastapi import UploadFile, File
from fastapi.responses import JSONResponse
import os

UPLOAD_DIR = "data/uploaded_resumes"
ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"]

@router.get("/get-resume-url/{user_id}/")
def get_resume_url(user_id: int):
    user_dir = os.path.join(UPLOAD_DIR, str(user_id))
    for ext in ALLOWED_EXTENSIONS:
        path = os.path.join(user_dir, f"resume{ext}")
        if os.path.exists(path):
            return {"url": f"/resumes/{user_id}/resume{ext}"}

    return JSONResponse(status_code=404, content={"message": "Resume not found."})


@router.post("/save-resume/{user_id}/")
async def save_resume(user_id: int, file: UploadFile = File(...)):
    filename = file.filename
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(status_code=400, content={"message": f"Unsupported file type: {ext}"})

    user_dir = os.path.join(UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    # Remove any previously saved resume file with different extension
    for prev_ext in ALLOWED_EXTENSIONS:
        old_path = os.path.join(user_dir, f"resume{prev_ext}")
        if os.path.exists(old_path):
            os.remove(old_path)

    file_path = os.path.join(user_dir, f"resume{ext}")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"message": f"Resume saved as resume{ext}."}


@router.post("/remove-resume/{user_id}/")
async def remove_resume(user_id: int):
    user_dir = os.path.join(UPLOAD_DIR, str(user_id))
    deleted = False

    for ext in ALLOWED_EXTENSIONS:
        path = os.path.join(user_dir, f"resume{ext}")
        if os.path.exists(path):
            os.remove(path)
            deleted = True

    if deleted:
        return {"message": "Resume removed successfully."}
    else:
        return {"message": "No resume found for this user."}
