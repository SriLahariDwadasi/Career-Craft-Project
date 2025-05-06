"use client";

import React, { useEffect, useState } from "react";
import { ScheduledTask } from "@/components/stepTracker/step-schedule";
import { updateScheduledTaskStatus } from "@/utils/api";

export default function ScheduleGrid({
    selectedDate,
    tasks,
    setTasks
}: {
    selectedDate: Date;
    tasks: ScheduledTask[];
    setTasks: React.Dispatch<React.SetStateAction<ScheduledTask[]>>;
}) {
    const [timeOffset, setTimeOffset] = useState<number | null>(null);
    const hourHeight = 60;

    function parseLocalDateOnly(dateStr: string): Date {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    function getStartOfWeek(date: Date) {
        const d = new Date(date);
        const day = d.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + offset);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    function getEndOfWeek(start: Date) {
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        end.setHours(0, 0, 0, 0);
        return end;
    }
    function isTodayInSameWeek(selected: Date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = getStartOfWeek(selected);
        const weekEnd = getEndOfWeek(weekStart);
        return today >= weekStart && today < weekEnd;
    }
    function getTodayColumnIndex() {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1;
    }

    const weekStart = getStartOfWeek(selectedDate);
    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
    const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const weekTasks = tasks.filter((task) => {
        const d = parseLocalDateOnly(task.date);
        return d >= weekStart && d < getEndOfWeek(weekStart);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const h = now.getHours(), m = now.getMinutes();
            if (h >= 8 && h < 21) {
                const mins = (h - 8) * 60 + m;
                setTimeOffset((mins / 60) * hourHeight);
            } else {
                setTimeOffset(null);
            }
        };
        updateTime();
        const iv = setInterval(updateTime, 60000);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        const now = new Date();

        const checkAndMarkSkipped = async () => {
            for (const task of tasks) {
                if (
                    task.status === "pending" &&
                    new Date(`${task.date}T${task.end}`) < now
                ) {
                    try {
                        await updateScheduledTaskStatus(task.id, "skipped");
                        setTasks((prev) =>
                            prev.map((x) =>
                                x.id === task.id ? { ...x, status: "skipped" } : x
                            )
                        );
                    } catch (err) {
                        console.error(`Error skipping task ${task.id}:`, err);
                    }
                }
            }
        };

        checkAndMarkSkipped();
        const interval = setInterval(checkAndMarkSkipped, 60000);
        return () => clearInterval(interval);
    }, [tasks, setTasks]);

    const handleBlockClick = async (e: React.MouseEvent, task: ScheduledTask) => {
        e.preventDefault();
        if (task.status !== "completed") {
            setTasks(prev =>
                prev.map(t => t.id === task.id ? { ...t, status: "completed" } : t)
            );
            try {
                await updateScheduledTaskStatus(task.id, "completed");
            } catch (err) {
                console.error("Failed to update task status:", err);
            }
        }
        window.open(task.resource_url, "_blank");
    };

    return (
        <div className="flex w-full">
            <div className="mt-18 flex flex-col items-end pr-2 w-[60px] text-sm text-gray-300 font-medium">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="h-[60px] flex items-start pr-2">
                        {8 + i}:00
                    </div>
                ))}
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-7 text-center text-indigo-200 mb-1">
                    {weekDates.map((d, i) => {
                        const cellDate = new Date(d);
                        cellDate.setHours(0, 0, 0, 0);
                        const isToday = cellDate.getTime() === today.getTime();

                        return (
                            <div key={d.toISOString()} className="flex flex-col items-center pt-2">
                                <div className={`text-2xl mb-1 font-bold ${isToday ? "text-indigo-600" : "text-indigo-200"}`}>{d.getDate()}</div>
                                <div className={`text-lg mb-1 font-bold ${isToday ? "text-indigo-600" : "text-indigo-200"}`}>{weekdayNames[i]}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="relative h-[780px]">
                    <div className="absolute inset-0 grid grid-cols-7 z-10">
                        {Array.from({ length: 7 }).map((_, dayIdx) => (
                            <div key={dayIdx} className="flex flex-col">
                                {Array.from({ length: 13 }).map((_, hourIdx) => (
                                    <div key={`d${dayIdx}-h${hourIdx}`} className="h-[60px] border border-white bg-white/40" />
                                ))}
                            </div>
                        ))}
                    </div>

                    {weekTasks.map((task, idx) => {
                        const taskDate = parseLocalDateOnly(task.date);
                        const [sh, sm] = task.start.split(":").map(Number);
                        const [eh, em] = task.end.split(":").map(Number);

                        const startMins = (sh - 8) * 60 + sm;
                        const endMins = (eh - 8) * 60 + em;
                        const topPx = (startMins / 60) * hourHeight;
                        const heightPx = ((endMins - startMins) / 60) * hourHeight;
                        const dayCol = (taskDate.getDay() + 6) % 7;

                        const endDateTime = new Date(taskDate);
                        endDateTime.setHours(eh, em, 0, 0);

                        const now = new Date();
                        const dotColor =
                            task.status === "completed" ? "#10B981" :
                                now > endDateTime ? "#EF4444" :
                                    "#FBBF24";
                        return (
                            <a
                                key={idx}
                                href={task.resource_url}
                                className="absolute w-[calc(100%/7)] px-1 z-30 cursor-pointer"
                                style={{
                                    top: `${topPx}px`,
                                    left: `calc((100%/7) * ${dayCol})`,
                                    height: `${heightPx}px`,
                                }}
                                onClick={e => handleBlockClick(e, task)}
                            >
                                <div className="relative h-full w-full rounded-md overflow-hidden shadow-lg hover:opacity-90 transition-all duration-200">
                                    <span className="absolute top-1 left-1 w-3 h-3 rounded-full z-50" style={{ backgroundColor: dotColor }} />
                                    <div className="absolute inset-0 bg-cover bg-no-repeat bg-top" style={{ backgroundImage: `url(${task.thumbnail_url})` }} />
                                    <div className="absolute top-0 right-0 w-[60%] bg-black/60 p-1 flex flex-col justify-between text-white">
                                        <div className="font-semibold text-indigo-100 text-[11px] overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }} title={task.resource_name}>{task.resource_name}</div>
                                        <div className="text-[11px] mt-1">{task.start.slice(0, 5)} – {task.end.slice(0, 5)}</div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}

                    {timeOffset !== null && isTodayInSameWeek(selectedDate) && (
                        <div
                            className="absolute w-[calc(100%/7)] border-t-4 border-red-500 z-50 transition-all duration-300 ease-in-out"
                            style={{
                                top: `${timeOffset}px`,
                                left: `calc((100%/7) * ${getTodayColumnIndex()})`,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
