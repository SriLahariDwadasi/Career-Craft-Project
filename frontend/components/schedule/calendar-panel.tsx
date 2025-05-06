"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from "date-fns";

export default function CalendarPanel({ selectedDate, setSelectedDate }: {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const renderHeader = () => (
        <div className="pt-2 mb-10 flex justify-between items-center mb-4 px-2 text-white">
            <button
                onClick={() =>
                    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))
                }
                className="rounded-lg text-indigo-1000 bg-indigo-600 round hover:text-white text-2xl px-2 transition cursor-pointer"
            >
                &lt;
            </button>
            <h2 className="text-2xl font-semibold text-indigo-200">
                {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
                onClick={() =>
                    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))
                }
                className="rounded-lg text-indigo-1000 bg-indigo-600 hover:text-white text-2xl px-2 transition cursor-pointer"
            >
                &gt;
            </button>
        </div>
    );

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
            <div className="grid grid-cols-7 font-bold text-center text-lg text-indigo-200 mb-2">
                {days.map(day => (
                    <div key={day}>{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let day = startDate;

        while (day <= endDate) {
            const days = [];

            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                days.push(
                    <div
                        key={day.toString()}
                        className={`p-2 text-lg text-center cursor-pointer rounded-full transition-all hover:bg-indigo-500/30
                            ${isCurrentMonth ? "text-white" : "text-gray-500"}
                            ${isSelected ? "bg-indigo-600 text-white" : ""}
                            ${isToday && !isSelected ? "bg-indigo-400/60" : ""}
                        `}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        {format(day, "d")}
                    </div>
                );

                day = addDays(day, 1);
            }

            rows.push(
                <div key={day.toString()} className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            );
        }

        return <div className="space-y-1">{rows}</div>;
    };

    return (
        <div className="p-4 bg-white/40 rounded-xl text-white">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}
