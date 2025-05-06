"use client";

import { useState } from "react";
import ResumePreview from "@/components/goal/resume-preview";
import Header from "@/components/ui/header";
import AuthProtected from "@/components/auth-protected";
import GoalDetails from "@/components/goal/goal-details";
import { updateUserGoal } from "@/utils/api";

export default function Goal() {

    return (

        <AuthProtected>
            <Header />
            <main className="mt-8 flex flex-row w-full min-h-screen p-3 gap-6">
                {/* Left: Resume */}
                <div className="w-[50%] flex justify-center">
                    <div className="w-[91%]">
                        <ResumePreview />
                    </div>
                </div>

                {/* Right: Your career goal components go here */}
                <div className="w-[50%]">
                    <div className="w-[96%]">
                        <GoalDetails />
                    </div>
                </div>
            </main>
        </AuthProtected>


    );
}