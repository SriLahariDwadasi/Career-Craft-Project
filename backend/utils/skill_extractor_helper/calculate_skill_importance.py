import re
import math
import json
from difflib import get_close_matches
import logging
import argparse
from .job_domain_classifier import JobTitleClassifier
from sentence_transformers import SentenceTransformer

def load_all_skill_graphs():

    domain_graph_mapping = {
        "Data Science & Analysis": "data scientist.json",
        "Site Reliability Engineering": "site reliability engineer.json",
        "Software Testing & QA": "software development engineer.json",
        "Software Development Engineering": "software engineer.json",
        "Machine Learning Engineering": "machine learning engineer.json",
        "Web & Frontend Development": "web developer.json",
        "DevOps & Infrastructure Engineering": "devops engineer.json",
        "Java Development": "java developer.json",
        "Business Analysis": "business analyst.json",
        "Architecture & Cloud Engineering": "data architect.json",
        "Project & Systems Management": "project manager.json",
    }

    skill_graphs = {}
    for domain_name, graph in domain_graph_mapping.items():
        try:
            with open(f"data/skill_graph/{graph}", "r") as f:
                skill_graphs[domain_name] = json.load(f)
        except FileNotFoundError:
            print(f"Warning: Skill graph for domain {domain_name} not found")
    return skill_graphs

def extract_skills_from_text(text):

    skills = []
    lines = text.strip().split('\n')
    
    i = 0
    while i < len(lines):
        if lines[i].startswith('- '):
            skill_line = lines[i][2:].strip()
            
            # Check if it's a nice-to-have skill
            if "(nice-to-have)" in skill_line:
                is_required = False
                skill_name = skill_line.replace("(nice-to-have)", "").strip()
            else:
                is_required = True
            
            if "(association)" in skill_line:
                skill_name = skill_line.replace("(association)", "").strip()
            elif "(prerequisite)" in skill_line:
                skill_name = skill_line.replace("(prerequisite)", "").strip()
            else:
                skill_name = skill_line
            
            # Get application and type
            application = ""
            skill_type = ""
            
            if i+1 < len(lines) and "Skill application:" in lines[i+1]:
                application = lines[i+1].replace("Skill application:", "").strip()
            
            if i+2 < len(lines) and "Technical skill type:" in lines[i+2]:
                skill_type = lines[i+2].replace("Technical skill type:", "").strip()
            
            skills.append({
                "name": skill_name,
                "application": application,
                "type": skill_type,
                "is_required": is_required
            })
            
            i += 3
        else:
            i += 1
    
    return skills

def get_skill_metrics(skill_name, skill_graph):

    skill_name_lower = skill_name.lower().strip()
    skill_data = None
    frequency = 0
    skill_type = None
    
    # Try exact match 
    for skill in skill_graph["skills"]:
        if skill["name"].lower() == skill_name_lower:
            skill_data = skill
            frequency = skill.get("frequency", 0)
            skill_type = skill.get("type", "")
            break
    
    # Try fuzzy matching with constraints
    if not skill_data:
        all_skill_names = []
        name_to_skill = {}
        
        for skill in skill_graph["skills"]:
            skill_graph_name = skill["name"].lower()
            
            # Check length similarity
            len_ratio = min(len(skill_name_lower), len(skill_graph_name)) / max(len(skill_name_lower), len(skill_graph_name))
            

            if len_ratio > 0.5:
                all_skill_names.append(skill_graph_name)
                name_to_skill[skill_graph_name] = skill
        
        matches = get_close_matches(skill_name_lower, all_skill_names, n=1, cutoff=0.75)
        
        if matches:
            match = matches[0]
            skill_data = name_to_skill[match]
            frequency = skill_data.get("frequency", 0)
            skill_type = skill_data.get("type", "")
            print("Fuzzy: ", skill_data)
    
    # Handle multi-part skills
    if not skill_data and ('/' in skill_name_lower or '-' in skill_name_lower or '&' in skill_name_lower):
        parts = re.split(r'[/\-\s,&]', skill_name_lower)
        valid_parts = [part for part in parts if part and len(part) > 1]
        
        matched_skills = []
        for part in valid_parts:
            for skill in skill_graph["skills"]:
                skill_graph_name = skill["name"].lower()
                
                if len(part) > 2 and (
                   part == skill_graph_name or 
                   (part in skill_graph_name and len(part) / len(skill_graph_name) > 0.7) or
                   (skill_graph_name in part and len(skill_graph_name) / len(part) > 0.7)):
                    matched_skills.append(skill)
        
        if matched_skills:
            skill_data = max(matched_skills, key=lambda s: s.get("frequency", 0))
            frequency = skill_data.get("frequency", 0)
            skill_type = skill_data.get("type", "")
            print("Multi: ", skill_data)
    
    # Special case handling
    if not skill_data:
        special_mappings = {
            "machine learning": ["machine learning", "ml"],
            "deep learning": ["deep learning", "dl"],
            "natural language processing": ["natural language processing", "nlp"],
            "neural network": ["neural network", "neural networks", "nn"],
            "c/c++": ["c++", "c"],
            "aws/gcp": ["aws", "gcp", "cloud"],
            "linux/unix": ["linux", "unix"]
        }
        
        for target, variations in special_mappings.items():
            if any(var in skill_name_lower or skill_name_lower in var for var in variations):
                for skill in skill_graph["skills"]:
                    if skill["name"].lower() == target or any(var == skill["name"].lower() for var in variations):
                        skill_data = skill
                        frequency = skill.get("frequency", 0)
                        skill_type = skill.get("type", "")
                        break
                if skill_data:
                    break
    
    # Get connections
    connections = {
        "count": 0,
        "strength": 0,
        "prerequisites": 0,
        "dependents": 0
    }
    
    if skill_data:
        skill_id = skill_data.get("id", "").lower()
        skill_graph_name = skill_data.get("name", "").lower()
        
        for rel in skill_graph.get("relationships", []):
            source = rel["source"].lower()
            target = rel["target"].lower()
            
            if (source == skill_id or source == skill_graph_name or 
                target == skill_id or target == skill_graph_name):
                
                connections["count"] += 1
                
                if "confidence" in rel:
                    connections["strength"] += rel["confidence"]
                elif "lift" in rel:
                    connections["strength"] += rel["lift"]
                elif "weight" in rel:
                    connections["strength"] += rel["weight"]
                else:
                    connections["strength"] += 0.5
                
                if rel.get("relationship") == "prerequisite":
                    if target == skill_id or target == skill_graph_name:
                        connections["prerequisites"] += 1
                    if source == skill_id or source == skill_graph_name:
                        connections["dependents"] += 1
    
    return {
        "skill_data": skill_data,
        "frequency": frequency,
        "type": skill_type,
        "connections": connections
    }

def calculate_importance_score(skill, skill_graph, seniority_level):

    metrics = get_skill_metrics(skill["name"], skill_graph)
    
    # Base score
    base_score = 10 if skill["is_required"] else 5
    
    # Frequency factor
    if metrics["frequency"] > 0:
        frequency_score = math.log(metrics["frequency"] + 1) / 5
        base_score += frequency_score
    
    # 2. Connection factors
    connections = metrics["connections"]
    if connections["count"] > 0:
        connection_score = math.log(connections["count"] + 1) / 4
        base_score += connection_score
        
        strength_score = math.log(connections["strength"] + 1) / 5
        base_score += strength_score
    
    # Prerequisite relationships
    if connections["dependents"] > 0:
        base_score *= (1 + 0.05 * connections["dependents"])
    if connections["prerequisites"] > 0:
        base_score *= (1 + 0.03 * connections["prerequisites"])
    
    # Skill type weights
    type_weights = {
        "language": 1.2,
        "platform": 1.1,
        "tool": 1.0,
        "concept": 1.0,
        "methodology": 0.95
    }
    skill_type = skill["type"].lower()
    base_score *= type_weights.get(skill_type, 1.0)
    
    # Seniority level weights
    seniority_weights = {
        "Internship": 0.7,
        "Entry level": 0.9,
        "Mid-Senior level": 1.2,
        "Associate": 1.0,
        "Director": 1.3,
        "Executive": 1.4
    }
    base_score *= seniority_weights.get(seniority_level, 1.0)
    
    # Expertise level
    application_text = skill["application"].lower()
    
    if "expert" in application_text or "expertise" in application_text or "advanced" in application_text:
        base_score *= 1.3
    elif "strong" in application_text or "proficient" in application_text:
        base_score *= 1.15
    elif "familiar" in application_text or "basic" in application_text or "exposure" in application_text:
        base_score *= 0.85
    
    # Years of experience mentioned
    years_match = re.search(r'(\d+)\+?\s*years?', application_text)
    if years_match:
        years = int(years_match.group(1))
        years_factor = min(1 + (years / 10), 1.5)  # Cap at 1.5x
        base_score *= years_factor
    
    normalized_score = min(round(base_score * 4, 1), 100)

    if metrics["skill_data"]:
        skill_name = metrics["skill_data"]["name"]
    else:
        skill_name = None

    return skill_name, normalized_score

def remove_duplicates_by_score(skills: list[tuple[str, float]]) -> list[tuple[str, float]]:
    skill_map = {}

    for skill, score in skills:
        key = skill.strip().lower()
        if key not in skill_map or score > skill_map[key][1]:
            skill_map[key] = (skill, score)

    return list(skill_map.values())

def calculate_skill_importance(skill_text, job_title, seniority_level):

    skill_graphs = load_all_skill_graphs()

    logging.getLogger('sentence_transformers').setLevel(logging.WARNING)
    model = SentenceTransformer('all-mpnet-base-v2')
    
    cluster_data = """
    Cluster 7
    [('Software Engineer', 729), ('Software Developer', 223), ('Software Development Engineer', 33), ('Software Engineer I', 30), ('Software Test Engineer', 26), ('Embedded Software Engineer', 18), ('Full-Stack Software Engineer', 17), ('Full Stack Software Engineer', 16), ('Software Engineer in Test', 13), ('Sr. Software Engineer', 13)]
    Cluster 5
    [('Data Scientist', 554), ('Data Analyst', 87), ('Data Engineer', 83), ('Big Data Engineer', 11), ('Associate Data Scientist', 8), ('Machine Learning Data Scientist', 7), ('Data Scientist I', 6), ('Data Scientist at IBM', 5), ('Data Scientist II', 4), ('Research Scientist', 4)]
    Cluster 1
    [('Machine Learning Engineer', 327), ('ML Engineer', 13), ('Machine Learning Data Engineer', 12), ('Software Engineer - Machine Learning', 7), ('Data Scientist/Machine Learning Engineer', 7), ('Machine Learning Software Engineer', 6), ('Data Scientist - Machine Learning', 4), ('Machine Learning Scientist/Engineer', 4), ('Machine Learning Scientist', 4), ('AI Engineer', 4)]
    Cluster 3
    [('Data Architect', 19), ('Solution Architect', 18), ('Solutions Architect', 14), ('Cloud Engineer', 13), ('Agile Coach', 13), ('Technical Architect', 9), ('Hadoop Developer', 9), ('Enterprise Architect', 9), ('Cloud Infrastructure Engineer', 8), ('Software Engineer - Office 365 Government Cloud Services', 8)]
    Cluster 6
    [('Not specified', 10), ('Software Development Engineer in Test (SDET)', 9), ('SDET', 9), ('ETL Developer', 8), ('SRE', 7), ('None', 7), ('ServiceNow Developer', 6), ('Quality Assurance', 6), ('Perl Developer', 5), ('Technology', 5)]
    Cluster 8
    [('Web Developer', 47), ('Full Stack Developer', 36), ('Front End Developer', 31), ('.NET Developer', 28), ('.Net Developer', 26), ('Developer', 18), ('Salesforce Developer', 18), ('iOS Developer', 18), ('Application Developer', 16), ('UI Developer', 16)]
    Cluster 9
    [('Project Manager', 71), ('Systems Administrator', 38), ('Account Executive', 30), ('Technical Project Manager', 19), ('Database Administrator', 18), ('Product Manager', 16), ('Program Manager', 14), ('Project Coordinator', 11), ('System Administrator', 11), ('Network Administrator', 11)]
    Cluster 11
    [('DevOps Engineer', 67), ('Network Engineer', 60), ('Systems Engineer', 36), ('Backend Engineer', 23), ('Technical Recruiter', 22), ('Full Stack Engineer', 21), ('Security Engineer', 18), ('Engineer', 14), ('Infrastructure Engineer', 14), ('Technical Support Specialist', 12)]
    Cluster 10
    [('Java Developer', 109), ('Android Developer', 19), ('Java Engineer', 12), ('Java/J2EE Developer', 12), ('Java Software Engineer', 11), ('Java Architect', 8), ('Sr. Java Developer', 7), ('Core Java Developer', 7), ('Full Stack Java Developer', 6), ('Android Software Development Engineer', 4)]
    Cluster 2
    [('Business Analyst', 74), ('SAP Supply Chain Consultant', 20), ('Business Systems Analyst', 18), ('Salesforce Business Analyst', 9), ('Quality Assurance Analyst', 8), ('SAP Consultant', 7), ('SQL Server DBA', 7), ('Business Intelligence Analyst', 6), ('Business Intelligence Developer', 6), ('Service Desk Analyst', 6)]
    Cluster 0
    [('Site Reliability Engineer', 310), ('Site Reliability Engineer (SRE)', 116), ('Sr. Site Reliability Engineer', 10), ('Software Engineer - Site Reliability Engineering (SRE)', 5), ('DevOps/Site Reliability Engineer', 5), ('AWS Site Reliability Engineer', 5), ('Site Reliability Engineer II', 4), ('Site Reliability Engineer, BizOps', 3), ('Automation Engineer and Site Reliability Engineer (SRE)', 3), ('Reliability Engineer', 3)]"""
    
    classifier = JobTitleClassifier(cluster_data, embedding_model=model)

    results = classifier.find_best_skill_graph_for_job(job_title)
    domain = results["domain"]
    
    skills = extract_skills_from_text(skill_text)
    skill_graph = skill_graphs[domain]

    skill_scores = []
    for skill in skills:
        skill_name, score = calculate_importance_score(skill, skill_graph, seniority_level)
        if skill_name:
            skill_scores.append((skill_name, score))
    
    skill_scores.sort(key=lambda x: x[1], reverse=True)
    
    return remove_duplicates_by_score(skill_scores)
