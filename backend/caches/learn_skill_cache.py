# backend/caches/learn_skill_cache.py

from cachetools import LRUCache
from fastapi.encoders import jsonable_encoder
from typing import List
from models import Learn_Skill  # Assuming you defined this ORM model

# Cache: key is user_id, value is list of learn_skill dicts
learn_skill_cache = LRUCache(maxsize=1000)

def get_cached_learn_skills(user_id: int) -> List[dict] | None:
    return learn_skill_cache.get(user_id)

def cache_learn_skills(user_id: int, skills: List[Learn_Skill]):
    learn_skill_cache[user_id] = [jsonable_encoder(skill) for skill in skills]

def clear_learn_skill_cache(user_id: int):
    learn_skill_cache.pop(user_id, None)

def clear_all_learn_skill_cache():
    learn_skill_cache.clear()
