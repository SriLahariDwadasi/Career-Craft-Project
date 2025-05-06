"use client";

import { useEffect, useState } from "react";
import { fetchUserGoal, updateUserGoal, fetchLearnSkill, fetchScheduledTasks, updateLearnSkill, updateScheduledTasks } from "@/utils/api";
import WarningModal from "@/components/ui/warning";

const weekdays: WeekdayKey[] = [
    "isMonday", "isTuesday", "isWednesday", "isThursday",
    "isFriday", "isSaturday", "isSunday"
];

type WeekdayKey =
    | "isMonday"
    | "isTuesday"
    | "isWednesday"
    | "isThursday"
    | "isFriday"
    | "isSaturday"
    | "isSunday";

const weekdayLabels: Record<WeekdayKey, string> = {
    isMonday: "M",
    isTuesday: "T",
    isWednesday: "W",
    isThursday: "T",
    isFriday: "F",
    isSaturday: "S",
    isSunday: "S",
};

interface Goal {
    target_position: string;
    industry: string;
    exp_level: string;
    weekly_hours: number;
    duration_weeks: number;
    responsibility?: string | null;
    isMonday: boolean;
    isTuesday: boolean;
    isWednesday: boolean;
    isThursday: boolean;
    isFriday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
}

export default function GoalDetails() {
    const [goal, setGoal] = useState<Goal | null>(null);
    const [editedGoal, setEditedGoal] = useState<Goal | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [hasSkills, setHasSkills] = useState(false);
    const [hasSchedule, setHasSchedule] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (userId) {
            fetchUserGoal(Number(userId))
                .then((data) => {
                    setGoal(data);
                    setEditedGoal(data);
                })
                .catch((err) => console.error("Failed to fetch goal:", err))
                .finally(() => setLoading(false));

            fetchLearnSkill(Number(userId)).then(skills => setHasSkills(skills.length > 0));
            fetchScheduledTasks(Number(userId)).then(tasks => setHasSchedule(tasks.length > 0));
        }
    }, []);

    const handleChange = (field: string, value: any) => {
        setEditedGoal((prev) => ({
            ...prev!,
            [field]: value,
        }));
    };

    const toggleDay = (day: WeekdayKey) => {
        setEditedGoal((prev) => ({
            ...prev!,
            [day]: !prev![day],
        }));
    };

    const confirmAndSave = async () => {
        const userId = Number(localStorage.getItem("user_id"));
        try {
            await updateUserGoal(userId, editedGoal);

            // Clear skills and/or schedule after goal change
            if (hasSkills) await updateLearnSkill(userId, []);
            if (hasSchedule) await updateScheduledTasks(userId, []);

            setGoal(editedGoal);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save goal:", error);
        } finally {
            setShowWarning(false);
        }
    };


    const handleSave = () => {
        if (hasSkills || hasSchedule) {
            const msg = hasSkills && hasSchedule
                ? "You've already generated skills and a schedule. Modifying goal will delete your current skills, schedule and learning progress. Do you want to continue?"
                : hasSkills
                    ? "You've already generated skills. Modifying goal will delete your current skills. Do you want to continue?"
                    : "You've already generated a schedule. Modifying goal will delete your current schedule and learning progress. Do you want to continue?";
            setWarningMessage(msg);
            setShowWarning(true);
        } else {
            confirmAndSave(); // No need for warning
        }
    };

    const handleCancel = () => {
        setEditedGoal(goal);
        setIsEditing(false);
    };

    if (loading || !editedGoal) return <div className="text-center text-gray-300 p-10">Loading resume...</div>;
    if (!goal) return <div className="text-red-400 p-10">No goal data found.</div>;

    return (
        <div className="p-4 bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl shadow-md text-white">
            <div className="mb-5">
                <div className="flex items-start justify-between w-full">
                    <h2 className="mb-6 text-3xl font-bold text-indigo-200">My Goal</h2>
                    <div className="flex gap-3">
                        {isEditing && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                        >
                            {isEditing ? "Save" : "Edit"}
                        </button>
                    </div>
                </div>

                {/* Job Title + Industry */}
                <div className="mb-5 flex gap-4">
                    <div className="w-1/2">
                        <p className="text-left mb-1 text-lg text-indigo-200">Career Position</p>
                        <input
                            type="text"
                            value={editedGoal.target_position}
                            onChange={(e) => handleChange("target_position", e.target.value)}
                            readOnly={!isEditing}
                            className={`mt-2 p-4 w-full rounded-lg text-lg text-white ${isEditing ? "bg-white/40 cursor-text" : "bg-white/20 cursor-default"} border border-gray-600`}
                        />
                    </div>
                    <div className="w-1/2">
                        <p className="text-left mb-1 text-lg text-indigo-200">Industry</p>
                        <input
                            type="text"
                            value={editedGoal.industry}
                            onChange={(e) => handleChange("industry", e.target.value)}
                            readOnly={!isEditing}
                            className={`mt-2 p-4 w-full rounded-lg text-lg text-white ${isEditing ? "bg-white/40 cursor-text" : "bg-white/20 cursor-default"} border border-gray-600`}
                        />
                    </div>
                </div>

                {/* Exp Level + Weekly Hours + Duration */}
                <div className="mb-5 flex gap-4">
                    <div className="w-1/3">
                        <p className="text-left mb-1 text-lg text-indigo-200">Experience Level</p>
                        <select
                            value={editedGoal.exp_level}
                            onChange={(e) => handleChange("exp_level", e.target.value)}
                            disabled={!isEditing}
                            className={`mt-2 p-4 w-full rounded-lg text-lg text-white ${isEditing ? "bg-white/40 cursor-pointer" : "bg-white/20 cursor-default"} border border-gray-600`}
                        >
                            <option value="" disabled hidden>Choose Experience Level</option>
                            <option value="Internship">Internship</option>
                            <option value="Entry level">Entry level</option>
                            <option value="Mid-Senior level">Mid-Senior level</option>
                            <option value="Associate">Associate</option>
                            <option value="Director">Director</option>
                            <option value="Executive">Executive</option>
                        </select>
                    </div>
                    <div className="w-1/3">
                        <p className="text-left mb-1 text-lg text-indigo-200">Weekly Hours</p>
                        <input
                            type="number"
                            value={editedGoal.weekly_hours}
                            onChange={(e) => handleChange("weekly_hours", Number(e.target.value))}
                            readOnly={!isEditing}
                            className={`mt-2 p-4 w-full rounded-lg text-lg text-white ${isEditing ? "bg-white/40 cursor-text" : "bg-white/20 cursor-default"} border border-gray-600`}
                        />
                    </div>
                    <div className="w-1/3">
                        <p className="text-left mb-1 text-lg text-indigo-200">Duration Weeks</p>
                        <input
                            type="number"
                            value={editedGoal.duration_weeks}
                            onChange={(e) => handleChange("duration_weeks", Number(e.target.value))}
                            readOnly={!isEditing}
                            className={`mt-2 p-4 w-full rounded-lg text-lg text-white ${isEditing ? "bg-white/40 cursor-text" : "bg-white/20 cursor-default"} border border-gray-600`}
                        />
                    </div>
                </div>

                {/* Weekdays */}
                <p className="mb-4 text-center text-lg text-indigo-200">Study Weekdays</p>
                <div className="mb-6 flex justify-center gap-2">
                    {weekdays.map((day) => (
                        <button
                            key={day}
                            onClick={() => isEditing && toggleDay(day)}
                            className={`px-6 py-4 rounded-full text-lg font-medium border transition ${editedGoal[day]
                                ? "bg-indigo-600 text-white border-indigo-400"
                                : "bg-white/20 text-white border-gray-400"
                                } ${isEditing ? "hover:bg-indigo-500 hover:text-white cursor-pointer" : "cursor-default"}`}
                        >
                            {weekdayLabels[day]}
                        </button>
                    ))}
                </div>

                {/* Responsibilities */}
                <p className="text-left mb-1 text-lg text-indigo-200">Responsibilities</p>
                <textarea
                    value={editedGoal.responsibility ?? ""}
                    onChange={(e) => handleChange("responsibility", e.target.value)}
                    readOnly={!isEditing}
                    className={`-mb-7 mt-2 p-4 w-full h-68 rounded-lg text-lg placeholder-white text-white ${isEditing ? "bg-white/40 cursor-text" : "bg-white/20 cursor-default"} border border-gray-600 resize-none`}
                    placeholder="Empty"
                />
            </div>
            <WarningModal
                isOpen={showWarning}
                onCancel={() => setShowWarning(false)}
                onConfirm={confirmAndSave}
                message={warningMessage}
            />
        </div>

    );
}
