from datetime import date, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Scheduled_Tasks
from typing import List
from pydantic import BaseModel
from caches.scheduled_tasks_cache import (
    get_cached_tasks,
    cache_tasks,
    clear_task_cache
)

router = APIRouter(tags=["Scheduled Tasks"])

class TaskRequest(BaseModel):
    user_id: int
    module: int
    skill: str                     # ✅ string now
    date: date            # format: YYYY-MM-DD
    resource_name: str
    resource_url: str
    thumbnail_url: str
    start: time                # format HH:MM
    end: time
    status: str

class TaskResponse(BaseModel):
    id: int                     # ✅ Include the primary key!
    user_id: int
    module: int
    skill: str
    date: date
    resource_name: str
    resource_url: str
    thumbnail_url: str
    start: time
    end: time
    status: str

    class Config:
        from_attributes = True


# === GET ALL TASKS FOR USER ===
@router.get("/{user_id}/", response_model=List[TaskResponse])
def get_scheduled_tasks(user_id: int, db: Session = Depends(get_db)):
    cached = get_cached_tasks(user_id)
    if cached:
        return cached

    tasks = db.query(Scheduled_Tasks).filter(Scheduled_Tasks.user_id == user_id).all()
    if not tasks:
        return []

    cache_tasks(user_id, tasks)
    return tasks


# === REPLACE ALL TASKS FOR USER ===
@router.post("/{user_id}/")
def update_scheduled_tasks(user_id: int, request: List[TaskRequest], db: Session = Depends(get_db)):
    db.query(Scheduled_Tasks).filter(Scheduled_Tasks.user_id == user_id).delete()
    db.commit()

    new_tasks = [Scheduled_Tasks(**task.model_dump()) for task in request]
    db.add_all(new_tasks)
    db.commit()

    clear_task_cache(user_id)
    return {
        "message": "Scheduled tasks updated successfully!",
        "user_id": user_id,
        "tasks_added": len(new_tasks)
    }


class TaskStatusUpdate(BaseModel):
    status: str

@router.patch("/{task_id}/")
def update_task_status(
    task_id: int,
    update: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    task = db.query(Scheduled_Tasks).filter(Scheduled_Tasks.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = update.status
    db.commit()

    clear_task_cache(task.user_id)
    return {"message": "Status updated", "task_id": task_id, "new_status": update.status}
