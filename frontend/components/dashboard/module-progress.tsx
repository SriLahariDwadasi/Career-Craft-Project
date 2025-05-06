"use client";

import React, { useEffect, useState } from "react";
import { fetchScheduledTasks } from "@/utils/api";
import { ScheduledTask } from "@/components/stepTracker/step-schedule";
import { parse, differenceInMinutes } from "date-fns";

export default function ModuleProgressPanel({ userId }: { userId: number }) {
    const [tasks, setTasks] = useState<ScheduledTask[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTasks() {
            try {
                const data = await fetchScheduledTasks(userId);
                setTasks(data);
            } catch (err) {
                setError("Failed to fetch scheduled tasks.");
            } finally {
                setLoading(false);
            }
        }

        loadTasks();
    }, [userId]);

    if (loading) return <div className="text-white">Loading module progress...</div>;
    if (error) return <div className="text-red-400">{error}</div>;
    if (!tasks || tasks.length === 0) return (
        <div className="w-full h-[82.9vh] p-6 bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl text-indigo-200 flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-semibold">No modules generateded yet.</h2>
        </div>
    );

    const modules = Array.from(new Set(tasks.map(t => t.module)));
    const grouped: { [module: number]: ScheduledTask[] } = {};
    modules.forEach((mod) => {
        grouped[mod] = tasks.filter(t => t.module === mod);
    });

    return (
        <div className="p-4 bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl shadow-md text-white">

            <h2 className="ml-2 mb-5 text-3xl mb-12 font-bold text-indigo-200">Module Progress</h2>
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                {modules.map((mod) => {
                    const modTasks = grouped[mod];
                    const total = modTasks.length;
                    const completed = modTasks.filter(t => t.status === "completed").length;
                    const percent = Math.round((completed / total) * 100);

                    const skills = Array.from(new Set(modTasks.map(t => t.skill)));
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
                            className="relative mb-3 cursor-pointer h-[320px] flex flex-col p-6 bg-indigo-100/50 backdrop-blur-sm rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
                        >
                            <span className="absolute -top-8 right-0 text-[120px] font-extrabold text-indigo-600 opacity-50 pointer-events-none">
                                {mod}
                            </span>

                            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                                {skills.map((skill) => {
                                    const count = modTasks.filter(t => t.skill === skill).length;
                                    return (
                                        <div
                                            key={skill}
                                            className="flex-1 bg-white/70 px-3 py-2 rounded-md shadow-sm flex flex-col justify-center"
                                        >
                                            <span className="font-semibold text-base text-gray-900 capitalize">{skill}</span>
                                            <span className="text-sm text-gray-800">{count} section{count !== 1 && "s"}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-3 flex items-center space-x-2">
                                <div className="flex-1 bg-white/70 rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <span className="text-indigo-600 font-semibold text-sm">{percent}%</span>
                            </div>
                            <div className="ml-3 mt-2 text-sm text-gray-700">
                                <span className="font-medium">Total Hours:</span> {totalHours}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
