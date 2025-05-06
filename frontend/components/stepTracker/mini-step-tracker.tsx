// --- MiniStepTracker.tsx ---
"use client";

import { useEffect, useState } from "react";
import StepResume from "@/components/stepTracker/step-resume";
import StepSkill from "@/components/stepTracker/step-skill";
import { fetchUserGoal, fetchLearnSkill, fetchResumeUrl } from "@/utils/api";
import MiniStepProgressBar from "./mini-step-progress-bar";
import LearnSkill from "../skill/learn-skill";

export default function MiniStepTracker({ userId }: { userId: number }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasResume, setHasResume] = useState(false);
    const [hasSkills, setHasSkills] = useState(false);

    useEffect(() => {
        async function initializeStep() {
            try {
                const url = await fetchResumeUrl(userId);
                const resumeExists = !!url;
                setHasResume(resumeExists); // this updates future renders

                const skills = await fetchLearnSkill(userId);
                const hasLearnedSkills = skills && skills.length > 0;
                setHasSkills(hasLearnedSkills);

                // ✅ Use local values here — not outdated state
                if (!resumeExists) return setStep(1);
                if (!hasLearnedSkills) return setStep(2);
                setStep(3);
            } catch (error) {
                console.error("MiniStepTracker init failed:", error);
            } finally {
                setLoading(false);
            }
        }

        initializeStep();
    }, [userId]);

    const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

    if (loading) {
        return <div className="text-white text-center py-10">Checking progress...</div>;
    }

    if (step === 3) return (
        <div className="mt-5 mb-30">
            <LearnSkill userId={userId} step={step} />
        </div>
    );

    return (
        <div className="relative w-full max-w-[1600px] px-6 mx-auto pb-28 space-y-10">
            <div className="flex items-center justify-center w-full max-w-[600px] mx-auto gap-2">
                {/* Back Button */}
                {step > 1 ? (
                    <button
                        onClick={handleBack}
                        className="mt-7 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                    >
                        &lt;
                    </button>
                ) : (
                    <div className="w-[44px] h-[40px] mt-4" /> // Placeholder for alignment (matches button size)
                )}

                {/* Progress Bar with fixed width */}
                <div className="w-[800px]">
                    <MiniStepProgressBar currentStep={step - 1} />
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    className={`mt-7 px-4 py-2 font-bold rounded-lg ${(step === 1 && !hasResume) ||
                        (step === 2 && !hasSkills)
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        }`}
                    disabled={
                        (step === 1 && !hasResume) ||
                        (step === 2 && !hasSkills)
                    }
                >
                    &gt;
                </button>
            </div>

            {step === 1 &&
                <div className="max-w-5xl px-6 mx-auto">
                    <StepResume userId={userId} onChange={() => {
                        setHasResume(true);
                        setStep(2);  // ✅ Auto jump to step 2
                    }} />
                </div>}
            {step === 2 && (
                <StepSkill
                    userId={userId}
                    onChange={() => {
                        setHasSkills(true);
                        setStep(3);  // ✅ Auto jump to step 3
                    }}
                />
            )}

        </div>
    );
}
