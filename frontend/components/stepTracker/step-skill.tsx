// --- StepSkill.tsx ---
"use client";

import { useEffect, useState } from "react";
import { fetchLearnSkill, generateLearnSkill, } from "@/utils/api";
import LearnSkill from "../skill/learn-skill";

interface LearnSkill {
    skill_name: string;
    focus_score: number;
    confidence_score: number;
}

export default function StepSkill({ userId, onChange }: { userId: number; onChange: () => void }) {
    const [skills, setSkills] = useState<LearnSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [originalSkills, setOriginalSkills] = useState<LearnSkill[]>([]);


    useEffect(() => {
        fetchLearnSkill(userId)
            .then((data) => {
                const cloned = data.map((skill: LearnSkill) => ({ ...skill }));
                setSkills(cloned);
                setOriginalSkills(cloned); // clean backup
            })
            .catch((err) => console.error("Failed to fetch skills:", err))
            .finally(() => setLoading(false));
    }, [userId]);


    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const newSkills = await generateLearnSkill(userId);
            setSkills(newSkills);
            if (onChange) onChange();
        } catch (error) {
            console.error("Error generating skills:", error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="text-center text-white">Loading skills...</div>;

    return (
        <div className="space-y-6">
            {generating ? (
                <div className="mt-10 flex flex-col items-center justify-center w-full h-[65vh] space-y-4 text-indigo-200">
                    <svg className="animate-spin h-8 w-8 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-2xl">Analyzing your resume skills in the job market...</p>
                    <p className="text-lg text-indigo-300">This may take 30-40 seconds. Hang tight! ⏳</p>
                </div>
            ) : skills.length === 0 ? (
                <div className="max-w-5xl px-6 mx-auto">
                    <div className="mt-10 flex flex-col items-center justify-center w-[95%] h-[65vh] aspect-[595/600] mx-auto border-2 border-dashed border-indigo-300 rounded-xl bg-white/10 backdrop-blur-md text-indigo-100 p-8 text-center space-y-6">

                        {/* Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" className="lucide lucide-brain-cog-icon lucide-brain-cog">
                            <path d="m10.852 14.772-.383.923" /><path d="m10.852 9.228-.383-.923" />
                            <path d="m13.148 14.772.382.924" /><path d="m13.531 8.305-.383.923" /><path d="m14.772 10.852.923-.383" />
                            <path d="m14.772 13.148.923.383" /><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 0 0-5.63-1.446 3 3 0 0 0-.368 1.571 4 4 0 0 0-2.525 5.771" />
                            <path d="M17.998 5.125a4 4 0 0 1 2.525 5.771" /><path d="M19.505 10.294a4 4 0 0 1-1.5 7.706" />
                            <path d="M4.032 17.483A4 4 0 0 0 11.464 20c.18-.311.892-.311 1.072 0a4 4 0 0 0 7.432-2.516" /><path d="M4.5 10.291A4 4 0 0 0 6 18" />
                            <path d="M6.002 5.125a3 3 0 0 0 .4 1.375" /><path d="m9.228 10.852-.923-.383" /><path d="m9.228 13.148-.923.383" />
                            <circle cx="12" cy="12" r="3" /></svg>

                        {/* Title */}
                        <h2 className="text-2xl font-semibold text-indigo-200">
                            Let's Take a Closer Look at Your Skills!
                        </h2>

                        {/* Description */}
                        <p className="text-indigo-100/80 max-w-[300px]">
                            You are one click away from a skill list picked just for you.
                        </p>

                        {/* Stylish Circular CTA Button */}
                        <button
                            onClick={handleGenerate}
                            className="mt-6 h-35 cursor-pointer w-35 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-bold shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                            title="Analyze Skills"
                        >
                            <svg className="pl-1 cursor-pointer lucide lucide-play-icon lucide-play" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                        </button>
                    </div>
                </div>


            ) : (
                <div className="mb-5">
                    <LearnSkill userId={userId} step={3} />
                </div>
            )}
        </div>
    );
}
