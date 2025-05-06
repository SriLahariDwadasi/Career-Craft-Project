import logging
from .job_domain_classifier import JobTitleClassifier
from sentence_transformers import SentenceTransformer



def matchJobDomain(job_title):
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

    domain_mapping = {
        "Data Science & Analysis": "data scientist",
        "Site Reliability Engineering": "site reliability engineer",
        "Software Testing & QA": "software development engineer",
        "Software Development Engineering": "software engineer",
        "Machine Learning Engineering": "machine learning engineer",
        "Web & Frontend Development": "web developer",
        "DevOps & Infrastructure Engineering": "devops engineer",
        "Java Development": "java developer",
        "Business Analysis": "business analyst",
        "Architecture & Cloud Engineering": "data architect",
        "Project & Systems Management": "project manager",
    }
    return domain_mapping[domain]