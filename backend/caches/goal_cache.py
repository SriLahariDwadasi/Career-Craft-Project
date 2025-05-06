# In-memory cache for user goal data
# Note: This is a per-process cache. If you restart the backend or scale across servers, it resets.
# For production, switch to Redis or another external cache.

from typing import Dict
from cachetools import LRUCache
from fastapi.encoders import jsonable_encoder
from models import User_Goal

# User goal cache: key is user_id, value is the goal object
user_goal_cache = LRUCache(maxsize=100)

def get_cached_user_goal(user_id: int):
    """Fetch user goal from cache if available."""
    return user_goal_cache.get(user_id)

def cache_user_goal(user_id: int, goal_data: User_Goal):
    """Store or update user goal in cache."""
    user_goal_cache[user_id] = jsonable_encoder(goal_data)


def clear_user_goal_cache(user_id: int):
    """Remove a user's goal from the cache."""
    user_goal_cache.pop(user_id, None)

def clear_all_user_goal_cache():
    """Clear the entire user goal cache (use with caution)."""
    user_goal_cache.clear()
