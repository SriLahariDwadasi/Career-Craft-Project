// --- StepSchedule.tsx ---
"use client";

import { useEffect, useState } from "react";
import { fetchScheduledTasks, generateScheduledTasks } from "@/utils/api";
import { parse, differenceInMinutes } from "date-fns";

export interface ScheduledTask {
    id: number;
    user_id: number;
    module: number;
    skill: string;
    date: string;   // string (ISO format, e.g. "2025-05-22")
    resource_name: string;
    resource_url: string;
    thumbnail_url?: string;   // optional if not always present
    start: string;       // "HH:MM" string from API
    end: string;         // "HH:MM" string from API
    status: string;
}

export default function StepSchedule({
    userId,
    onChange,
    tasks,
    setTasks
}: {
    userId: number;
    onChange: () => void;
    tasks: ScheduledTask[];
    setTasks: (tasks: ScheduledTask[]) => void;
}) {

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedModules, setGeneratedModules] = useState([]);
    const [previewReady, setPreviewReady] = useState(false);

    useEffect(() => {
        fetchScheduledTasks(userId)
            .then((data) => setTasks(data))
            .catch((err) => console.error("Failed to fetch scheduled tasks:", err))
            .finally(() => setLoading(false));
    }, [userId]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await generateScheduledTasks(userId);
            setTasks(response.tasks || []);
            setGeneratedModules(response.modules || []); // if modules returned
            setPreviewReady(true);
            if (onChange) onChange(); // enables step change in StepTracker
        } catch (err) {
            console.error("Error generating schedule:", err);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="-mt-70 flex items-center justify-center min-h-screen text-white text-lg">Loading scheduled tasks...</div>;

    console.log("Previewing tasks:", tasks.slice(0, 5));


    return (
        <div className="space-y-6">
            {generating ? (
                <div className="mt-10 flex flex-col items-center justify-center w-full h-[65vh] space-y-4 text-indigo-200">
                    <svg className="animate-spin h-8 w-8 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-2xl">Generating your personalized schedule...</p>
                    <p className="text-lg text-indigo-300">This may take 20-30 seconds. Hang tight! ⏳</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="max-w-5xl px-6 mx-auto">
                    <div className="mt-10 flex flex-col items-center justify-center w-[95%] h-[65vh] aspect-[595/600] mx-auto border-2 border-dashed border-indigo-300 rounded-xl bg-white/10 backdrop-blur-md text-indigo-100 p-8 text-center space-y-6">

                        {/* Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="lucide lucide-brain-circuit-icon lucide-brain-circuit">
                            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                            <path d="M9 13a4.5 4.5 0 0 0 3-4" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" />
                            <path d="M12 13h4" /><path d="M12 18h6a2 2 0 0 1 2 2v1" /><path d="M12 8h8" />
                            <path d="M16 8V5a2 2 0 0 1 2-2" /><circle cx="16" cy="13" r=".5" /><circle cx="18" cy="3" r=".5" />
                            <circle cx="20" cy="21" r=".5" /><circle cx="20" cy="8" r=".5" /></svg>

                        {/* Title */}
                        <h2 className="text-2xl font-semibold text-indigo-200">
                            Let's Find Your Perosnalized Learning Path!
                        </h2>

                        {/* Description */}
                        <p className="text-indigo-100/80 max-w-[300px]">
                            You are one click away from a schedule designed just for you.
                        </p>

                        {/* Stylish Circular CTA Button */}
                        <button
                            onClick={handleGenerate}
                            className="mt-6 cursor-pointer h-35 w-35 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-bold shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                            title="Analyze Skills"
                        >
                            <svg className="pl-1 cursor-pointer lucide lucide-play-icon lucide-play" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {previewReady && tasks.length > 0 && (
                        <div className="mt-6 w-full px-4 lg:px-8">
                            <h2 className="ml-2 mb-5 text-3xl font-bold text-indigo-200">Module Overview</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
                                {Array.from(new Set(tasks.map((t) => t.module))).map((mod) => {
                                    const modTasks = tasks.filter((t) => t.module === mod);
                                    const skills = Array.from(new Set(modTasks.map((t) => t.skill)));
                                    const totalMinutes = modTasks.reduce((sum, task) => {
                                        const start = parse(task.start, "HH:mm", new Date());
                                        const end = parse(task.end, "HH:mm", new Date());
                                        const duration = differenceInMinutes(end, start);
                                        return sum + duration;
                                    }, 0);

                                    const totalHours = (totalMinutes / 60).toFixed(1);
                                    return (
                                        <div
                                            key={mod}
                                            className="relative h-[340px] flex flex-col p-6 bg-indigo-100/50 backdrop-blur-sm rounded-lg shadow-lg transition-transform duration-300 ease-in-out 
                                       hover:scale-105 
                                       hover:shadow-2xl
                                       cursor-pointer"
                                        >
                                            {/* Module number */}
                                            <span className="absolute -top-4 right-3 text-[120px] font-extrabold text-indigo-600 opacity-50 pointer-events-none">
                                                {mod}
                                            </span>

                                            {/* Skill blocks */}
                                            <div className="flex-1 flex flex-col gap-2 mr-5">
                                                {skills.map((skill) => {
                                                    const count = modTasks.filter((t) => t.skill === skill).length;
                                                    return (
                                                        <div
                                                            key={skill}
                                                            className="flex-1 bg-white/70 p-1 rounded-md shadow-sm flex flex-col justify-center"
                                                        >
                                                            <span className="pl-3 font-semibold text-2xl text-gray-900 capitalize">{skill}</span>
                                                            <span className="pl-3 text-sm text-gray-800">
                                                                {count} section{count !== 1 && "s"}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="ml-3 mt-2 text-sm text-gray-700">
                                                <span className="font-medium">Total Hours:</span> {totalHours}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>



            )}
        </div>
    );
}
