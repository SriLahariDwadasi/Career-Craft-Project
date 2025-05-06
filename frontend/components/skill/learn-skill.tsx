// --- learnSkill.tsx ---
"use client";

import { useEffect, useState } from "react";
import { fetchLearnSkill, updateLearnSkill, fetchScheduledTasks, updateScheduledTasks } from "@/utils/api";
import WarningModal from "@/components/ui/warning"; // make sure you have this path


interface LearnSkill {
    skill_name: string;
    focus_score: number;
    confidence_score: number;
}

export default function LearnSkill({ userId, step }: { userId: number; step: number }) {
    const [skills, setSkills] = useState<LearnSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [originalSkills, setOriginalSkills] = useState<LearnSkill[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const [hasSchedule, setHasSchedule] = useState(false);
    const [onConfirmSave, setOnConfirmSave] = useState<() => void>(() => () => { });

    useEffect(() => {
        if (step === 3) {
            const fetchData = async () => {
                try {
                    const skillData = await fetchLearnSkill(userId);
                    const cloned = skillData.map((s: LearnSkill) => ({ ...s }));
                    setSkills(cloned);
                    setOriginalSkills(cloned);

                    const tasks = await fetchScheduledTasks(userId);
                    setHasSchedule(tasks.length > 0);
                } catch (err) {
                    console.error("Failed to fetch skills or tasks:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [userId, step]);

    const handleFocusChange = (index: number, value: number) => {
        setSkills((prev) =>
            prev.map((skill, i) => (i === index ? { ...skill, focus_score: value } : skill))
        );
    };

    const handleConfidenceChange = (index: number, value: number) => {
        setSkills((prev) =>
            prev.map((skill, i) => (i === index ? { ...skill, confidence_score: value } : skill))
        );
    };

    const handleCancel = () => {
        const reset = originalSkills.map((skill) => ({ ...skill }));
        setSkills(reset);
        setIsEditing(false);
    };

    const normalizeFocusScores = (skills: LearnSkill[]): LearnSkill[] => {
        const total = skills.reduce((sum, skill) => sum + skill.focus_score, 0);
        if (total === 0) return skills;

        return skills.map((skill) => ({
            ...skill,
            focus_score: parseFloat((skill.focus_score / total).toFixed(4)),
        }));
    };

    const handleSaveClick = () => {
        if (hasSchedule) {
            setOnConfirmSave(() => handleSave);
            setShowWarning(true);
        } else {
            handleSave();
        }
    };


    const handleSave = async () => {
        try {
            const normalized = normalizeFocusScores(skills);
            await updateLearnSkill(userId, normalized);
            setSkills(normalized.map((s) => ({ ...s })));
            setOriginalSkills(normalized.map((s) => ({ ...s })));
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving skills:", error);
        }
    };

    const handleDelete = (index: number) => {
        const updated = skills.filter((_, i) => i !== index);
        setSkills(updated);
    };

    if (loading) return <div className="text-center text-white">Loading skills...</div>;
    if (step < 3) return null;

    return (
        <>
            <div className="flex justify-center w-full">
                <div className="space-y-6 max-w-[1600px] px-6">
                    <div className="w-full h-full overflow-hidden bg-white/20 backdrop-blur-md rounded-xl shadow-xl p-6 pb-10">

                        <div className="mb-5 flex items-start justify-between">
                            <h2 className="mb-2 text-3xl font-bold text-indigo-200">Learning Skills</h2>
                            <div className="flex gap-3 pr-3">
                                {isEditing && (
                                    <button
                                        onClick={handleCancel}
                                        className="cursor-pointer px-4 py-2 rounded-lg text-white font-semibold bg-gray-500 hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => (isEditing ? handleSaveClick() : setIsEditing(true))}
                                    className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                                >
                                    {isEditing ? "Save" : "Edit"}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {skills.map((skill, index) => (
                                <div
                                    key={index}
                                    className="w-[240px] h-[230px] rounded-xl overflow-hidden flex flex-col
                                    transform transition duration-300 ease-in-out
                                    shadow-md hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]
                                    hover:scale-[1.03]
                                    hover:ring-2 hover:ring-indigo-400 hover:ring-opacity-50 cursor-pointer"
                                >
                                    <div className="h-[200px] relative ">
                                        {/* 1) background image as <img> with reduced opacity */}
                                        <div className="absolute inset-0">
                                            <img
                                                src={`/images/skills/${(index % 20) + 1}.jpg`}
                                                className="w-full h-full object-cover opacity-80"
                                                alt={skill.skill_name}
                                            />
                                        </div>


                                        {/* 3) your title & delete icon, z-index above the image */}
                                        <div className="absolute bg-gradient-to-b from-black/80 via-black/10 to-transparent inset-0 flex items-start justify-center pt-4 px-2 z-10">
                                            <h3 className="text-2xl font-bold text-indigo-100 capitalize text-center drop-shadow w-[80%]">
                                                {skill.skill_name}
                                            </h3>

                                            {isEditing && (
                                                <button
                                                    onClick={() => handleDelete(index)}
                                                    className="absolute top-1 right-2.5 text-red-500 font-bold hover:text-white cursor-pointer"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>


                                    {/* Info section */}
                                    <div className="flex-1 px-4 py-2 flex flex-col justify-between bg-indigo-300">
                                        {/* Label row */}
                                        <div className="mb-1 flex pl-[21px] justify-start gap-15 text-[12px] text-gray-700 font-bold">
                                            <span>Focus</span>
                                            <span>Confidence</span>
                                        </div>

                                        {/* Input row */}
                                        <div className="mb-1 flex pl-[18px] justify-start gap-5">
                                            <input
                                                type="number"
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                value={Number(skill.focus_score)}
                                                onChange={(e) => handleFocusChange(index, parseFloat(e.target.value))}
                                                readOnly={!isEditing}
                                                className="w-[40%] px-2 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                value={Number(skill.confidence_score)}
                                                onChange={(e) => handleConfidenceChange(index, parseFloat(e.target.value))}
                                                readOnly={!isEditing}
                                                className="w-[40%] px-2 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </div>
                </div>
            </div>
            <WarningModal
                isOpen={showWarning}
                message="You've already generated a schedule. Modifying skills will delete your current schedule and learning progress. Do you want to continue?"
                onCancel={() => setShowWarning(false)}
                onConfirm={async () => {
                    setShowWarning(false);
                    await updateScheduledTasks(userId, []);     // API function to delete all schedule rows for user
                    await handleSave();                    // Save modified skills
                }}
            />
        </>

    );
}
