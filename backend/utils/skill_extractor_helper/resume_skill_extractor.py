import json
import re
import fitz
from typing import Dict, List, Any, Optional, Tuple
from google import genai

def extract_text_from_pdf(file_bytes) -> str:
    """Extract text from a PDF file"""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""
        
def extract_text_from_docx(file_bytes) -> str:
    """Extract text from a DOCX file"""
    try:
        import io
        from docx import Document
        
        doc = Document(io.BytesIO(file_bytes))
        text = []
        for para in doc.paragraphs:
            text.append(para.text)
        return "\n".join(text)
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""
    
def parse_json_response(response: str) -> List[Dict]:
    """Parse the JSON response from the LLM"""
    # Find JSON content in the response (it might be embedded in text)
    json_pattern = r'```json\s*([\s\S]*?)\s*```'
    json_match = re.search(json_pattern, response)
    
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find JSON without code blocks
        json_pattern = r'\[\s*\{.*\}\s*\]'
        json_match = re.search(json_pattern, response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            # Last resort, assume the entire response is JSON
            json_str = response
    
    try:
        data = json.loads(json_str)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        print(f"Response: {response}")
        return []
    
def remove_duplicates(skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate skills by keeping the highest confidence version"""
    # Create a dictionary to store the highest confidence score for each skill
    skill_dict = {}
    
    # Process each skill
    for skill in skills:
        skill_name = skill.get('skill', '').lower()  # Normalize to lowercase
        confidence = skill.get('confidence', 0)
        
        # If this skill doesn't exist yet or has a higher confidence, update
        if skill_name not in skill_dict or confidence > skill_dict[skill_name].get('confidence', 0):
            skill_dict[skill_name] = skill
    
    # Convert back to list, sorting by confidence
    unique_skills = list(skill_dict.values())
    return sorted(unique_skills, key=lambda x: x.get('confidence', 0), reverse=True)

def get_skills_as_tuples(skills: List[Dict[str, Any]]) -> List[Tuple[str, float]]:
        """
        Convert skills dictionaries to a list of tuples (skill_name, confidence_score)
        
        Args:
            skills: List of skill dictionaries
            
        Returns:
            List of (skill_name, confidence_score) tuples
        """
        # Process each skill and create tuples
        skill_tuples = []
        seen_skills = set()
        
        for skill in skills:
            skill_name = skill.get('skill', 'Unknown')
            confidence = skill.get('confidence', 0)
            
            # Skip duplicates (case-insensitive)
            if skill_name.lower() in seen_skills:
                continue
        
            seen_skills.add(skill_name.lower())
            
            # Add to the list
            skill_tuples.append((skill_name, confidence))
            
        return skill_tuples
        
def extract_skills_with_llm(skill_list, resume_text: str, api_key) -> List[Dict[str, Any]]:
    # Create prompt for skill extraction

    prompt = f"""
TASK:
You are an expert AI tasked with analyzing resumes to evaluate the candidate's demonstrated proficiency in each technical skill from a predefined list.
Your objective is to assign a **confidence score between 0.0 and 100.0** for each skill in the SKILL LIST, reflecting how well that skill is evidenced in the RESUME.
No explanations or commentary are allowed — **output only the JSON array**.

SCORING GUIDELINES (for each skill):
**100.0** - Extensive, clearly demonstrated expertise (e.g. multiple job roles, advanced projects, certifications, tools or libraries tied to the skill)
**75.0 - 99.9** - Strong, practical usage (e.g. used in key projects, listed in responsibilities, paired with related tools or platforms)
**50.0 - 74.9** - Moderate or partial exposure (e.g. mentioned once or used as a supporting tool, course or internship)
**25.0 - 49.9** - Light familiarity or vague mention (e.g. in a course list, minor project, or soft skill grouping)
**0.0 - 24.9** - No evidence or only superficial mention (e.g. resume includes unrelated topics or lacks any mention)

EVIDENCE TO CONSIDER:
- **Direct mentions**: skills listed explicitly in work experience, education, certifications, or project descriptions
- **Indirect indicators**: tools or frameworks tightly associated with a skill (e.g. “Pandas” implies some Python; “Spring Boot” implies Java)
- **Depth signals**: frequency of mention, job title relevance (e.g. “Data Scientist” implies Python + ML), verbs like *built, led, optimized*
- **Recency and context**: Recent and active usage counts more than passive learning or outdated experience
- Avoid guessing. If a skill appears indirectly, give partial confidence — do not assume full proficiency unless clearly justified by the resume.

SKILL LIST:
{skill_list}

RESUME:
{resume_text}

RESPONSE FORMAT:
Respond with a single valid JSON array of objects with these properties:
- skill: The canonical skill name that should match exactly those in the input SKILL LIST (omitting from or adding to the list are NOT allowed)
- confidence: Numeric score from 0.0 to 100.0

Remember to only return a valid JSON array with nothing else.
"""

    # Call LLM
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.0-flash", contents=prompt
    )

    # Parse response
    skills = parse_json_response(response.text)

    # Remove any duplicates that might still be present
    unique_skills = remove_duplicates(skills)

    return unique_skills

def analyze_resume_file(file_path, file_type, skill_list, api_key):
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    text = ""
    if file_type.lower() == "pdf":
        text = extract_text_from_pdf(file_bytes)
    elif file_type.lower() == "docx":
        text = extract_text_from_docx(file_bytes)
    else:
        # Assume plain text
        try:
            text = file_bytes.decode("utf-8")
        except:
            text = ""

    if not text:
        return []
    
    skills = extract_skills_with_llm(skill_list, text, api_key)

    return get_skills_as_tuples(skills)

        

        
