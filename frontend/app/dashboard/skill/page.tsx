"use client";
import { useEffect, useState } from "react";

import Header from "@/components/ui/header";
import AuthProtected from "@/components/auth-protected";
import MiniStepTracker from "@/components/stepTracker/mini-step-tracker";

export default function SkillPage() {
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedId = localStorage.getItem("user_id");
            if (storedId) {
                setUserId(Number(storedId));
            }
        }
    }, []);

    if (userId === null) return <div>Loading...</div>;

    return (
        <AuthProtected>
            <Header />
            <MiniStepTracker userId={userId} />
        </AuthProtected>
    );
}
