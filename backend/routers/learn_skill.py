from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Learn_Skill
from typing import List
from pydantic import BaseModel
from caches.learn_skill_cache import (
    get_cached_learn_skills,
    cache_learn_skills,
    clear_learn_skill_cache
)

router = APIRouter(tags=["User Learning Skills"])

class LearnSkillRequest(BaseModel):
    skill_name: str
    focus_score: float
    confidence_score: float

class LearnSkillResponse(BaseModel):
    user_id: int  # include if you want this info in response
    skill_name: str
    focus_score: float
    confidence_score: float
 
    class Config:
        from_attributes = True

@router.get("/{user_id}/", response_model=List[LearnSkillResponse])
def get_learn_skill(user_id: int, db: Session = Depends(get_db)):
    cached = get_cached_learn_skills(user_id)
    if cached:
        return cached

    skills = db.query(Learn_Skill).filter(Learn_Skill.user_id == user_id).all()
    if not skills:
        return []

    cache_learn_skills(user_id, skills)
    return skills

@router.post("/{user_id}/")
def update_learn_skill(user_id: int, request: List[LearnSkillRequest], db: Session = Depends(get_db)):
    # Replace existing skills
    db.query(Learn_Skill).filter(Learn_Skill.user_id == user_id).delete()
    db.commit()

    # Insert new normalized skill list
    new_skills = [Learn_Skill(user_id=user_id, **item.model_dump()) for item in request]
    db.add_all(new_skills)
    db.commit()

    clear_learn_skill_cache(user_id)
    return {"message": f"Normalized and replaced learning skills for user {user_id}"}