"use client";

import { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css";
import AuthProtected from "@/components/auth-protected";
import Header from "@/components/ui/header";
import StepTracker from "@/components/stepTracker/step-tracker";

export default function SchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedId = localStorage.getItem("user_id");
            if (storedId) {
                setUserId(Number(storedId));
            }
        }
    }, []);

    if (userId === null) return <div className="flex items-center justify-center min-h-screen text-white text-lg">Loading...</div>;

    return (
        <AuthProtected>
            <Header />
            <StepTracker userId={userId} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </AuthProtected>

    );
}