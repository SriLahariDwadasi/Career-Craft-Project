from collections import defaultdict
import json
import networkx as nx
import numpy as np


def load_knowledge_graph(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_prerequisite_edges(graph_path, input_skill_set):
    knowledge_graph = load_knowledge_graph(graph_path)
    prereq_edges = []
    for rel in knowledge_graph.get("relationships", []):
        if rel["relationship"] == "prerequisite":
            src, tgt = rel["source"].lower(), rel["target"].lower()
            if src in input_skill_set and tgt in input_skill_set:
                prereq_edges.append((src, tgt, rel["weight"]))
    return prereq_edges


def parse_association_weights(graph_path, input_skill_set, threshold=0.4, conf_weight=0.8):
    knowledge_graph = load_knowledge_graph(graph_path)
    association_scores = {}

    # Step 1: Collect direct associations
    for rel in knowledge_graph.get("relationships", []):
        if rel["relationship"] == "association":
            src, tgt = rel["source"].lower(), rel["target"].lower()
            if src in input_skill_set and tgt in input_skill_set:
                confidence = rel.get("confidence", 0)
                lift = rel.get("lift", 0)
                if confidence > threshold:
                    norm = (1 / (1 + np.exp(-lift)) - 0.5) / 0.5  # sigmoid & normalize
                    weight = conf_weight * confidence + (1-conf_weight) * norm
                else:
                    weight = 0
                association_scores[(src, tgt)] = weight
                association_scores[(tgt, src)] = weight

    return association_scores



def build_prereq_graph_from_edges(prereq_edges):
    G = nx.DiGraph()
    for src, tgt, weight in prereq_edges:
        G.add_edge(src, tgt, weight=weight)
    return G


def break_cycles(graph):
    while True:
        try:
            cycle = nx.find_cycle(graph, orientation="original")
            weakest = min(cycle, key=lambda e: graph.get_edge_data(e[0], e[1]).get("weight", 1.0))
            graph.remove_edge(weakest[0], weakest[1])
        except nx.exception.NetworkXNoCycle:
            break


def topological_sort_with_priorities(prereq_graph, input_skill_set):
    break_cycles(prereq_graph)

    try:
        topo_order = list(nx.topological_sort(prereq_graph))

        skill_scores = {}
        for skill in topo_order:
            incoming = list(prereq_graph.in_edges(skill, data=True))
            prereq_weight = sum(data['weight'] for _, _, data in incoming) / len(incoming) if incoming else 0
            skill_scores[skill] = prereq_weight

        refined_order = sorted(topo_order, key=lambda s: skill_scores[s])

        for skill in input_skill_set:
            if skill not in refined_order:
                refined_order.append(skill)

        return refined_order

    except nx.NetworkXUnfeasible:
        return list(prereq_graph.nodes())


def group_skills_by_association(topo_order, association_scores, total_hours, input_skills, prereq_graph, threshold=0.3, max_portion=1/3):
    groups = []
    skill_to_module = {}
    prereq_map = defaultdict(set)
    skill_focus_map = {s[0].lower(): s[1] for s in input_skills}


    if not isinstance(prereq_graph, nx.Graph):
        prereq_graph = build_prereq_graph_from_edges(prereq_graph)

    for src, tgt in prereq_graph.edges():
        prereq_map[tgt].add(src)

    for skill in topo_order:
        max_prereq_module = max(
            [skill_to_module[pre] for pre in prereq_map[skill] if pre in skill_to_module],
            default=-1
        )

        best_group = None
        best_score = 0

        for idx in range(max_prereq_module + 1, len(groups)):
            group = groups[idx]
            new_skill_duration = round(skill_focus_map.get(skill, 0) * total_hours, 1)
            durations = [round(skill_focus_map.get(s, 0) * total_hours, 1) for s in group]
            total_duration = sum(durations) + new_skill_duration
            if len(group) >= 3 or total_duration > max_portion * total_hours:
                continue
            score = sum(association_scores.get((skill, other), 0) for other in group)
            avg_score = score / len(group) if group else 0
            if avg_score >= threshold:
                best_group = idx
                best_score = avg_score
                break

        if best_group is not None:
            groups[best_group].append(skill)
            skill_to_module[skill] = best_group
        else:
            groups.append([skill])
            skill_to_module[skill] = len(groups) - 1

    return groups


def assign_module_durations(skill_groups, input_skills, total_hours):
    skill_focus_map = {s[0].lower(): s[1] for s in input_skills}
    module_durations = []

    for group in skill_groups:
        durations = [round(skill_focus_map.get(skill, 0) * total_hours, 1) for skill in group]
        module_durations.append(durations)

    modules = []
    for i, (skills, durations) in enumerate(zip(skill_groups, module_durations), 1):
        modules.append({
            "module": i,
            "skills": skills,
            "duration": durations
        })
    return modules

def generate_modules(graph_path, matched_domain, input_skills, total_weeks, weekly_hours, threshold = 0.42, conf_weight=0.5):
    total_hours = total_weeks * weekly_hours
    

    input_skill_set = set(s[0].lower() for s in input_skills)
    prereq_edges = parse_prerequisite_edges(graph_path, input_skill_set)
    assoc_scores = parse_association_weights(graph_path, input_skill_set, threshold, conf_weight)
    prereq_graph = build_prereq_graph_from_edges(prereq_edges)
    ordered_skills = topological_sort_with_priorities(prereq_graph, input_skill_set)
    skill_groups = group_skills_by_association(
    ordered_skills, assoc_scores, total_hours, input_skills, prereq_graph, threshold=0.1)
    final_modules = assign_module_durations(skill_groups, input_skills, total_hours)
    return final_modules