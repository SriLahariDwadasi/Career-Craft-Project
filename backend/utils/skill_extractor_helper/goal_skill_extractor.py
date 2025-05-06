import requests
import time
import re

def split_text(text):
    parts = re.split(r'[.,;:!?]', text)
    return [p.strip() for p in parts if p.strip()]

def extractGoalSkills(api_url, title, level, industry, responsibility, max_retries=3):
    if responsibility:
        res = [industry] + split_text(responsibility)
    else:
        res = [industry]

    payload = {
        "job_title": title,
        "experience_level": level,
        "responsibilities": res
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(api_url, json=payload)

            if response.status_code != 200:
                print(f"[❌ ERROR] Request failed with status: {response.status_code}")
                print(f"[📭 BODY] Response: {response.text}")
                continue

            json_data = response.json()
            skills = json_data.get("predicted_skills", "")

            if skills:
                return skills
            else:
                print(f"[⚠️ Empty skills] Attempt {attempt + 1}/{max_retries} returned no skills.")
                time.sleep(1)  # optional backoff

        except Exception as e:
            print(f"[🔥 JSON ERROR] Attempt {attempt + 1}/{max_retries} failed: {e}")
            print(f"[📭 RAW TEXT] {response.text if 'response' in locals() else 'No response object'}")
            time.sleep(1)

    return ""
