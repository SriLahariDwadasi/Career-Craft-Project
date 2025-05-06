import re
import json
import numpy as np
from typing import Dict, List, Tuple, Any, Optional, Union
from collections import Counter
import logging

class JobTitleClassifier:
    
    # Common stopwords to remove from job titles during analysis
    STOPWORDS = {'the', 'and', 'for', 'with', 'not', 'this', 'that', 'are', 'from', 'was', 
               'were', 'have', 'has', 'had', 'been', 'will', 'shall', 'may', 'can', 'could', 
               'would', 'should', 'must', 'ought', 'also', 'then', 'than', 'when', 'where', 
               'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 
               'such', 'nor', 'not', 'only', 'own', 'same', 'too', 'very', 'just', 'even', 
               'but', 'again', 'further', 'however', 'hence', 'still', 'yet', 'here', 'there'}
    
   # Map of cluster IDs to domain names
    CLUSTER_DOMAIN_MAP = {
        "0": "Site Reliability Engineering",
        "1": "Machine Learning Engineering",
        "2": "Business Analysis",
        "3": "Architecture & Cloud Engineering", 
        #"4": "General Software Engineering",
        "5": "Data Science & Analysis",
        "6": "Software Testing & QA",
        "7": "Software Development Engineering",
        "8": "Web & Frontend Development",
        "9": "Project & Systems Management",
        "10": "Java Development",
        "11": "DevOps & Infrastructure Engineering"
    }
    
    # Map domains to skill graph files
    DOMAIN_TO_SKILL_GRAPH = {
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
    
    def __init__(self, cluster_data: str, embedding_model=None):
        """
        Initialize the classifier with cluster data and an optional embedding model.
        
        Args:
            cluster_data: Raw string with cluster information (formatted text)
            embedding_model: Optional model for semantic embeddings (e.g., SentenceTransformer)
        """
        self.clusters = self.parse_cluster_data(cluster_data)
        self.cluster_profiles = self.generate_cluster_profiles()
        self.embedding_model = embedding_model
        self.cluster_totals = {}
        for cluster_id, jobs in self.clusters.items():
            self.cluster_totals[cluster_id] = sum(job["frequency"] for job in jobs)
            
        self.job_title_index = {}
        for cluster_id, jobs in self.clusters.items():
            for job in jobs:
                title_lower = job["title"].lower()
                self.job_title_index[title_lower] = {
                    "cluster_id": cluster_id,
                    "frequency": job["frequency"]
                }
    
    def parse_cluster_data(self, data: str) -> Dict[str, List[Dict[str, Union[str, int]]]]:
        
        clusters = {}
        
        # Split by cluster
        cluster_pattern = r"Cluster\s+(\d+)\s*\n(.*?)(?=Cluster\s+\d+\s*\n|$)"
        cluster_matches = re.finditer(cluster_pattern, data, re.DOTALL)
        
        for match in cluster_matches:
            cluster_id = match.group(1).strip()
            cluster_content = match.group(2).strip()
            
            # Parse job titles and frequencies
            job_pattern = r"\('([^']+)',\s+(\d+)\)"
            job_matches = re.finditer(job_pattern, cluster_content)
            
            job_freq_list = []
            for job_match in job_matches:
                job_title = job_match.group(1)
                frequency = int(job_match.group(2))
                job_freq_list.append({
                    "title": job_title,
                    "frequency": frequency
                })
            
            clusters[cluster_id] = job_freq_list
            
        return clusters
    
    def generate_cluster_profiles(self) -> Dict[str, Dict[str, Any]]:
     
        profiles = {}
        
        for cluster_id, jobs in self.clusters.items():

            all_words = []
            for job in jobs:
                words = self._extract_keywords(job["title"])
                all_words.extend(words)
            
            word_counts = Counter(all_words)
            top_keywords = [word for word, _ in word_counts.most_common(10)]
            job_count = sum(job["frequency"] for job in jobs)
        
            profiles[cluster_id] = {
                "keywords": top_keywords,
                "job_count": job_count,
                "top_jobs": [job["title"] for job in sorted(jobs, key=lambda x: x["frequency"], reverse=True)[:5]]
            }
            
        return profiles
    
    def _extract_keywords(self, text: str) -> List[str]:

        text = text.lower()
        words = re.sub(r'[^\w\s]', ' ', text).split()
        keywords = [word for word in words if word not in self.STOPWORDS and len(word) > 2]
        
        return keywords
    
    def classify_job_by_exact_match(self, job_title: str) -> Optional[Dict[str, Any]]:

        normalized_title = job_title.lower().strip()
        
        if normalized_title in self.job_title_index:
            match_info = self.job_title_index[normalized_title]
            return {
                "cluster_id": match_info["cluster_id"],
                "confidence": 1.0,
                "match_type": "exact",
                "frequency": match_info["frequency"]
            }
        
        return None
    
    def classify_job_with_embeddings(self, job_title: str) -> Dict[str, Any]:

        job_embedding = self.embedding_model.encode(job_title)

        scores = {}
        
        for cluster_id, jobs in self.clusters.items():
            domain = self.CLUSTER_DOMAIN_MAP.get(f"{cluster_id}")

            cluster_similarities = []
            total_jobs_in_cluster = sum(job["frequency"] for job in jobs)
            
            for job in jobs:
                job_embed = self.embedding_model.encode(job["title"])
                similarity = self._cosine_similarity(job_embedding, job_embed)
                normalized_frequency = job["frequency"] / total_jobs_in_cluster
                weighted_similarity = max(similarity * np.log(max(np.log(normalized_frequency*100),0.0001)), 0)
                cluster_similarities.append((weighted_similarity, job["frequency"]))
            
            if cluster_similarities:
                best_similarity = max(cluster_similarities, key=lambda x: x[0])
                scores[cluster_id] = {
                    "score": best_similarity[0],
                    "frequency": best_similarity[1]
                }
            else:
                scores[cluster_id] = {
                    "score": 0,
                    "frequency": 0
                }
        
        sorted_scores = sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True)
        best_match = sorted_scores[0]
        
        return {
            "cluster_id": best_match[0],
            "confidence": best_match[1]["score"],
            "match_type": "embedding",
            "frequency": best_match[1]["frequency"]
        }
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0
            
        return dot_product / (norm1 * norm2)
    
    def classify_job_to_domain(self, job_title: str) -> Dict[str, Any]:

        exact_match = self.classify_job_by_exact_match(job_title)
        if exact_match:
            domain = self.CLUSTER_DOMAIN_MAP.get(exact_match["cluster_id"], "Unknown")
            return {
                "domain": domain,
                "cluster_id": exact_match["cluster_id"],
                "confidence": 1.0,
                "match_type": "exact"
            }

        if self.embedding_model:
            result = self.classify_job_with_embeddings(job_title)
        else:
            result = {
                "cluster_id": list(self.clusters.keys())[0],
                "confidence": 0.01,
                "match_type": "fallback",
                "frequency": 0
            }
        
        domain = self.CLUSTER_DOMAIN_MAP.get(result["cluster_id"], "Unknown")
        
        return {
            "domain": domain,
            "cluster_id": result["cluster_id"],
            "confidence": result["confidence"],
            "match_type": result["match_type"]
        }
    
    def find_best_skill_graph_for_job(self, job_title: str) -> Dict[str, Any]:
        classification = self.classify_job_to_domain(job_title)
        
        return {
            "recommended_skill_graph": self.DOMAIN_TO_SKILL_GRAPH.get(classification["domain"], "general_skillgraph.json"),
            "confidence": classification["confidence"],
            "domain": classification["domain"],
            "match_type": classification["match_type"]
        }