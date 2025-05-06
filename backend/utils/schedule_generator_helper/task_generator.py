from datetime import datetime, timedelta
import pulp
import copy
from typing import List, Dict

def distribute_short_hours(module_hours, learning_days, max_per_day=10):
    # Active days
    active_days = [d for d, on in learning_days.items() if on]
    allocations = {d: 0.0 for d in active_days}
    remaining = round(module_hours * 2) / 2  # force 0.5 precision

    # Step 1: Prioritize weekdays only (Mon–Fri)
    weekdays = [d for d in active_days if d not in ["Saturday", "Sunday"]]
    i = 0
    while remaining >= 0.5 and weekdays:
        day = weekdays[i % len(weekdays)]
        if allocations[day] + 0.5 <= max_per_day:
            allocations[day] += 0.5
            remaining -= 0.5
        i += 1
        if i > len(weekdays) * 20:
            break  # fallback if trapped

    # Step 2: If still remaining, use weekends too
    if remaining >= 0.5:
        i = 0
        while remaining >= 0.5:
            day = active_days[i % len(active_days)]
            if allocations[day] + 0.5 <= max_per_day:
                allocations[day] += 0.5
                remaining -= 0.5
            i += 1
            if i > len(active_days) * 20:
                break

    # Step 3: Try to reduce weekend load (remove up to 3h if possible)
    transferable = 0
    for day in ["Saturday", "Sunday"]:
        if allocations.get(day, 0) >= 6:
            allocations[day] -= 3
            transferable += 3
        elif allocations.get(day, 0) >= 4:
            allocations[day] -= 2
            transferable += 2
        elif allocations.get(day, 0) >= 2:
            allocations[day] -= 1
            transferable += 1

    # Step 4: Redistribute to weekdays
    j = 0
    failed = 0
    while transferable >= 0.5 and weekdays:
        day = weekdays[j % len(weekdays)]
        if allocations[day] + 0.5 <= max_per_day:
            allocations[day] += 0.5
            transferable -= 0.5
        else:
            failed += 1
        j += 1
        if failed >= len(weekdays):
            break

    # Step 5: Return leftover back to weekends if needed
    if transferable >= 0.5:
        weekend_days = [d for d in ["Saturday", "Sunday"] if d in active_days]
        k = 0
        while transferable >= 0.5 and weekend_days:
            day = weekend_days[k % len(weekend_days)]
            allocations[day] += 0.5
            transferable -= 0.5
            k += 1

    return allocations


# === DAILY HOURS DISTRIBUTOR ===
def distribute_weekly_hours(weekly_hours, learning_days):
    active_days = [day for day, active in learning_days.items() if active]
    allocations = {day: 0.0 for day in active_days}

    # Step 1: Round-robin fill 0.5h per day until weekly_hours exhausted
    remaining = weekly_hours
    i = 0
    while remaining >= 0.5:
        day = active_days[i % len(active_days)]
        allocations[day] += 0.5
        remaining -= 0.5
        i += 1

    # Step 2: Try to reduce 1h from each weekend day if it leaves >= 1h
    transferable = 0
    for day in ["Saturday", "Sunday"]:
        if allocations.get(day, 0) >= 6:
            allocations[day] -= 2
            transferable += 2
        elif allocations.get(day, 0) >= 4:
            allocations[day] -= 1
            transferable += 1

    # Step 3: Redistribute to weekdays with live 0.5h check against 8h cap
    weekdays = [d for d in active_days if d not in ["Saturday", "Sunday"]]
    j = 0
    failed_transfers = 0
    while transferable >= 0.5 and weekdays:
        day = weekdays[j % len(weekdays)]
        if allocations[day] + 0.5 <= 10:
            allocations[day] += 0.5
            transferable -= 0.5
        else:
            failed_transfers += 1
        j += 1

        if failed_transfers >= len(weekdays):
            break  # All weekdays have hit the cap

    # Step 4: If some hours couldn't be placed, return them to weekends
    weekend_days = [d for d in ["Saturday", "Sunday"] if d in active_days]
    if transferable >= 0.5 and weekend_days:
        k = 0
        while transferable >= 0.5:
            day = weekend_days[k % len(weekend_days)]
            allocations[day] += 0.5
            transferable -= 0.5
            k += 1

    # Step 5: Enforce overall cap of 10 hours per day
    overflow = 0.0
    for day in allocations:
        if allocations[day] > 10:
            overflow += allocations[day] - 10
            allocations[day] = 10.0

    # Re-distribute overflow back to under-cap days in 0.5h chunks
    if overflow > 0:
        under_cap_days = [d for d in allocations if allocations[d] < 10]
        i = 0
        while overflow >= 0.5 and under_cap_days:
            day = under_cap_days[i % len(under_cap_days)]
            if allocations[day] + 0.5 <= 10:
                allocations[day] += 0.5
                overflow -= 0.5
            i += 1
    print(allocations)
    return allocations

# === LEARNING BLOCKS GENERATOR ===
def generate_learning_blocks(L_hours):
    block_duration = 15  # minutes
    total_blocks = (21 - 8) * 4  # 08:00 to 21:00 → 13 hours = 52 blocks

    # 🍽️ Fixed break labels (your definition)
    # Lunch: labels 11:00–11:45 → indices 12–15
    # Dinner: labels 17:00–17:45 → indices 36–39
    lunch_blocks = [12, 13, 14, 15]
    dinner_blocks = [36, 37, 38, 39]
    fixed_breaks = set(lunch_blocks + dinner_blocks)

    L_blocks = L_hours * 4  # convert learning hours to 15-min blocks

    # Create the LP problem
    prob = pulp.LpProblem("Learning_Schedule", pulp.LpMaximize)
    x = [pulp.LpVariable(f"x_{i}", cat="Binary") for i in range(total_blocks)]

    # Create learning group variables
    group_indices = []
    group_id = 0
    for i in range(total_blocks):
        if i in fixed_breaks:
            continue
        for l in range(4, 13):  # valid group sizes: 1 to 3 hours
            if i + l > total_blocks:
                continue
            if any(j in fixed_breaks for j in range(i, i + l)):
                continue
            group = pulp.LpVariable(f"group_{group_id}", cat="Binary")
            group_indices.append((group_id, i, l, group))

            # If group is active, all blocks must be learning
            for j in range(i, i + l):
                prob += x[j] >= group

            # Enforce at least 15-min break after the group
            if i + l < total_blocks and (i + l not in fixed_breaks):
                prob += x[i + l] <= 1 - group

            group_id += 1

    # Total learning time = user input
    prob += pulp.lpSum([x[i] for i in range(total_blocks) if i not in fixed_breaks]) == L_blocks

    # Prevent overlapping groups and force blocks to be part of exactly one group
    for i in range(total_blocks):
        if i in fixed_breaks:
            prob += x[i] == 0
        else:
            groups_covering = [group for _, start, length, group in group_indices
                               if start <= i < start + length]
            prob += pulp.lpSum(groups_covering) <= 1
            prob += x[i] == pulp.lpSum(groups_covering) if groups_covering else x[i] == 0

    # 🎯 Objective:
    # 1. Prefer afternoon blocks (12:00–17:00 → block indices 16–35)
    # 2. Penalize group lengths < 6 or > 8
    # 🟢 Preferred blocks: Midday (12:00–17:00)
    preferred_blocks = list(range(16, 36))  # 12:00 to 17:00
    preferred_score = pulp.lpSum([x[i] for i in preferred_blocks if i not in fixed_breaks])

    # 🔴 Penalize early morning (08:00–10:00) and late evening (19:00–21:00)
    penalize_early = list(range(0, 5))    # 08:00–10:00
    penalize_late = list(range(47, 52))   # 19:00–21:00
    penalty_score = pulp.lpSum([x[i] for i in penalize_early + penalize_late if i not in fixed_breaks])

    # ⛔ Penalize groups that are too short or too long
    group_penalty = pulp.lpSum([
        (6 - l) * group if l < 6 else (l - 8) * group if l > 8 else 0
        for _, _, l, group in group_indices
    ])

    # 🎯 Combined objective
    prob += preferred_score - penalty_score - group_penalty

    # Solve
    prob.solve(pulp.PULP_CBC_CMD(msg=False))

    # Output: merged continuous learning sessions
    results = []
    base_time = datetime.strptime("08:00", "%H:%M")
    current_start = None

    for i in range(total_blocks):
        is_learning = pulp.value(x[i]) == 1
        is_fixed = i in fixed_breaks
        block_start = base_time + timedelta(minutes=i * block_duration)
        block_end = block_start + timedelta(minutes=block_duration)

        if is_learning and not current_start:
            current_start = block_start
        elif (not is_learning or is_fixed) and current_start:
            results.append({
                'start': current_start.strftime("%H:%M"),
                'end': block_start.strftime("%H:%M")
            })
            current_start = None

    if current_start:
        results.append({
            'start': current_start.strftime("%H:%M"),
            'end': (base_time + timedelta(minutes=total_blocks * block_duration)).strftime("%H:%M")
        })

    return results

block_cache = {}

def schedule_module(module, start_date, weekly_hours, learning_days, skill_course_dict, user_id):

    module_id = module['module']
    total_duration = sum([round(d * 2) / 2 for d in module['duration']])  # Round each to nearest 0.5
    skills = module['skills']
    scheduled_sessions = []
    current_date = start_date
    hours_remaining = total_duration

    # Build course stack
    course_pool = []
    for skill in skills:
        for course in skill_course_dict.get(skill, []):
            course_entry = copy.deepcopy(course)
            course_entry['remaining'] = round(course_entry['duration'] * 2) / 2
            course_entry['skill'] = skill
            course_pool.append(course_entry)
    course_pool.sort(key=lambda x: -x['duration'])

    # Fixed weekly allocation and blocks
    if weekly_hours <= hours_remaining:
        daily_hours = distribute_weekly_hours(weekly_hours, learning_days)
    else:
        daily_hours = distribute_short_hours(hours_remaining, learning_days)

    block_plan = {}
    for day_name, hours in daily_hours.items():
        if hours < 0.5:
            continue
        if hours not in block_cache:
            block_cache[hours] = generate_learning_blocks(hours)
        block_plan[day_name] = block_cache[hours]

    while hours_remaining > 0.0:
        day_name = current_date.strftime("%A")
        if not learning_days.get(day_name, False) or day_name not in block_plan:
            current_date += timedelta(days=1)
            continue

        blocks = block_plan[day_name]
        used_today = set()  # Track courses already scheduled today
        one_course_left = len([c for c in course_pool if c['remaining'] >= 0.5]) == 1
        if one_course_left:
            break

        for block in blocks:
            block_start = datetime.strptime(f"{current_date.date()} {block['start']}", "%Y-%m-%d %H:%M")
            block_end = datetime.strptime(f"{current_date.date()} {block['end']}", "%Y-%m-%d %H:%M")
            block_duration = round(((block_end - block_start).seconds / 3600) * 2) / 2
            for course in course_pool:
                remaining = round(course['remaining'] * 2) / 2
                if remaining < 0.5:
                    continue
                if not one_course_left and course['title'] in used_today:
                    continue

                allocated = min(remaining, block_duration)
                allocated = round(allocated * 2) / 2
                if allocated < 1.0:
                    continue  # Only fill if 1h or more

                actual_end = block_start + timedelta(hours=allocated)

                scheduled_sessions.append({
                    'user_id': user_id,
                    'module': module_id,
                    'skill': course['skill'],
                    'date': current_date.strftime("%Y-%m-%d"),
                    'resource_name': course['title'],
                    'resource_url': course['link'],
                    'thumbnail_url': course['image_link'],
                    'start': block_start.strftime("%H:%M"),
                    'end': actual_end.strftime("%H:%M"),
                    "status": "pending"
                })

                course['remaining'] -= allocated
                course['remaining'] = round(course['remaining'] * 2) / 2

                if course['remaining'] < 0.5:
                    course['remaining'] = 0.0
                elif 0.5 <= course['remaining'] < 1.0:
                    course['remaining'] = 1.0

                used_today.add(course['title'])
                break  # Stop after assigning one course per block

        hours_remaining = round(
            sum(c['remaining'] for c in course_pool if c['remaining'] >= 0.5) * 2
        ) / 2
        current_date += timedelta(days=1)

    return scheduled_sessions




def schedule_all_modules(final_modules, start_date, weekly_hours, learning_days, suggestions, user_id):
    all_sessions = []
    current_date = start_date

    offset = 0
    for module in final_modules:
        module["module"] = module["module"] - offset
        module_sessions = schedule_module(
            module=module,
            start_date=current_date,
            weekly_hours=weekly_hours,
            learning_days=learning_days,
            skill_course_dict=suggestions,
            user_id=user_id
        )
        all_sessions.extend(module_sessions)

        if module_sessions:
            last_date_str = module_sessions[-1]['date']
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
            current_date = last_date + timedelta(days=1)
        else:
            offset += 1

    return all_sessions
