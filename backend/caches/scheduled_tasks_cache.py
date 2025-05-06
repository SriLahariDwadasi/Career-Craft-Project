from typing import List
from cachetools import LRUCache
from fastapi.encoders import jsonable_encoder
from models import Scheduled_Tasks

# Cache: key = user_id, value = list of tasks (encoded)
scheduled_tasks_cache = LRUCache(maxsize=1000)

def get_cached_tasks(user_id: int):
    return scheduled_tasks_cache.get(user_id)

def cache_tasks(user_id: int, tasks: List[Scheduled_Tasks]):
    scheduled_tasks_cache[user_id] = jsonable_encoder(tasks)

def clear_task_cache(user_id: int):
    scheduled_tasks_cache.pop(user_id, None)

def clear_all_task_cache():
    scheduled_tasks_cache.clear()