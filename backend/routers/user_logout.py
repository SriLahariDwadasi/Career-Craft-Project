from fastapi import APIRouter, HTTPException
from caches.goal_cache import clear_user_goal_cache
from caches.learn_skill_cache import clear_learn_skill_cache
from caches.scheduled_tasks_cache import clear_task_cache

router = APIRouter(tags=["User Login"])

@router.post("/{user_id}/")
def logout_and_clear_cache(user_id: int):
    try:
        clear_user_goal_cache(user_id)
        clear_learn_skill_cache(user_id)
        clear_task_cache(user_id)
        return {"success": True, "message": f"Cleared all caches for user {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))