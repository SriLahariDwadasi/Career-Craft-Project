"use client";

import { useState } from "react";
type StudyDays = {
    isMonday: boolean;
    isTuesday: boolean;
    isWednesday: boolean;
    isThursday: boolean;
    isFriday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
};

interface Props {
    studyDays: StudyDays;
    setStudyDays: React.Dispatch<React.SetStateAction<StudyDays>>;
    weeklyHours: string;
    setWeeklyHours: (value: string) => void;
}


export default function WeeklyHours({
    weeklyHours,
    setWeeklyHours,
    studyDays,
    setStudyDays,
}: Props) {
    const daysOfWeek: { name: string; key: keyof StudyDays }[] = [
        { name: "Monday", key: "isMonday" },
        { name: "Tuesday", key: "isTuesday" },
        { name: "Wednesday", key: "isWednesday" },
        { name: "Thursday", key: "isThursday" },
        { name: "Friday", key: "isFriday" },
        { name: "Saturday", key: "isSaturday" },
        { name: "Sunday", key: "isSunday" },
    ];

    const handleDayToggle = (dayKey: keyof StudyDays) => {
        setStudyDays((prev) => ({
            ...prev,
            [dayKey]: !prev[dayKey],
        }));
    };

    return (
        <>
            <h2 className="mb-8 animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl text-center">
                Weekly Study Time
            </h2>

            <div className="mb-10 flex items-center justify-center space-x-3">
                <input
                    type="number"
                    value={weeklyHours}
                    onChange={(e) =>
                        setWeeklyHours(
                            Math.min(77, isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value)).toString()
                        )
                    }
                    className="p-3 w-24 rounded-lg bg-gray-800/40 text-white placeholder-white/70 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text"
                    placeholder="0"
                />
                <span className="text-indigo-100 text-lg">Hours per Week</span>
            </div>

            <p className="mb-4 text-center text-indigo-200 text-lg">Select Your Study Days</p>

            <div className="grid grid-cols-3 gap-4 text-white">
                {daysOfWeek.map(({ name, key }) => (
                    <button
                        key={key}
                        onClick={() => handleDayToggle(key)}
                        className={`px-4 py-3 rounded-lg text-lg font-semibold transition-all duration-200 w-full cursor-pointer ${studyDays[key]
                            ? "bg-indigo-500 text-white shadow-md"
                            : "bg-gray-800/40 text-white/70 hover:bg-white/30"
                            }`}
                    >
                        {name}
                    </button>
                ))}
            </div>
        </>
    );
}
