from fastapi     import APIRouter, Query
from pydantic    import BaseModel
from typing      import List, Optional
from sentence_transformers import SentenceTransformer
import csv, math

router = APIRouter(tags=["Map"])   # no prefix here

# Preload model on CPU
MODEL = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

# Load CSV
DATA_PATH = "data/job_map.csv"
JOBS = []
with open(DATA_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        if not r["CITY_LATITUDE"] or not r["STATE_LATITUDE"]:
            continue
        JOBS.append({
            "CITY":      r["CITY"],
            "STATE":     r["STATE"],
            "SALARY":    float(r["SALARY"]),
            "TITLE_EMB": [float(x) for x in r["TITLE_EMB"].split(",")],
            "CITY_LAT":  float(r["CITY_LATITUDE"]),
            "CITY_LNG":  float(r["CITY_LONGITUDE"]),
            "STATE_LAT": float(r["STATE_LATITUDE"]),
            "STATE_LNG": float(r["STATE_LONGITUDE"]),
        })

def cosine(a: List[float], b: List[float]) -> float:
    dot   = sum(x*y for x,y in zip(a,b))
    mag_a = math.sqrt(sum(x*x for x in a))
    mag_b = math.sqrt(sum(y*y for y in b))
    return dot/(mag_a*mag_b + 1e-8)

class MapPoint(BaseModel):
    name:      str
    avgSalary: float
    lat:       float
    lng:       float

@router.get("/", response_model=List[MapPoint])
def get_map(
    mode:      str           = Query("CITY", regex="^(CITY|STATE)$"),
    minSalary: float         = Query(0, ge=0),
    maxSalary: float         = Query(float("inf"), ge=0),
    q:         Optional[str] = Query(None, description="Job title keyword"),
):
    # 1) Salary filter
    filtered = [job for job in JOBS if minSalary <= job["SALARY"] <= maxSalary]

    # 2) Semantic filter
    if q:
        q_emb = MODEL.encode(q)
        filtered = [job for job in filtered if cosine(q_emb, job["TITLE_EMB"]) > 0.7]

    # 3) Aggregate
    buckets = {}
    for job in filtered:
        key = job[mode]
        lat = job["CITY_LAT"] if mode=="CITY" else job["STATE_LAT"]
        lng = job["CITY_LNG"] if mode=="CITY" else job["STATE_LNG"]
        b = buckets.setdefault(key, {"total":0.0,"count":0,"lat":0.0,"lng":0.0})
        b["total"] += job["SALARY"]
        b["count"] += 1
        b["lat"]   += lat
        b["lng"]   += lng

    # 4) Build response
    out = []
    for name, b in buckets.items():
        cnt = b["count"]
        out.append(MapPoint(
            name=name,
            avgSalary=b["total"]/cnt,
            lat=b["lat"]/cnt,
            lng=b["lng"]/cnt
        ))
    return out
