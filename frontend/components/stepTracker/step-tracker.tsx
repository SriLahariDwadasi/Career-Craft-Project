"use client";

import { useEffect, useState } from "react";
import StepProgressBar from "@/components/stepTracker/step-progress-bar";
import StepResume from "@/components/stepTracker/step-resume";
import StepSkill from "@/components/stepTracker/step-skill";
import StepSchedule, { ScheduledTask } from "@/components/stepTracker/step-schedule";
import {
    fetchUserGoal,
    fetchLearnSkill,
    fetchScheduledTasks,
    fetchResumeUrl,
} from "@/utils/api";
import CalendarPanel from "../schedule/calendar-panel";
import ScheduleGrid from "../schedule/schedule-grid";
import MiniModulePanel from "../schedule/mini-module-panel";


export default function StepTracker({
    userId,
    selectedDate,
    setSelectedDate
}: {
    userId: number,
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasResume, setHasResume] = useState(false);
    const [hasSkills, setHasSkills] = useState(false);
    const [hasTasks, setHasTasks] = useState(false);
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);

    useEffect(() => {
        async function initializeStep() {
            try {
                const url = await fetchResumeUrl(userId);
                setHasResume(!!url);

                const skills = await fetchLearnSkill(userId);
                setHasSkills(skills.length > 0);

                // <-- FIXED HERE -->
                const fetchedTasks = await fetchScheduledTasks(userId);
                setHasTasks(fetchedTasks.length > 0);
                setTasks(fetchedTasks);

                if (!url) return setStep(1);
                if (!skills.length) return setStep(2);
                if (!fetchedTasks.length) return setStep(3);
                setStep(4);
            } catch (error) {
                console.error("StepTracker init failed:", error);
            } finally {
                setLoading(false);
            }
        }
        initializeStep();
    }, [userId]);

    const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

    if (loading) {
        return <div className="-mt-50 flex items-center justify-center min-h-screen text-white text-lg">Checking setup progress...</div>;
    }

    if (step === 4) {
        return (
            <main className="flex flex-row w-full min-h-screen p-5 gap-6">
                {/* Left: Calendar + MiniModulePanel */}
                <div className="pl-3 pt-5 w-[25%] space-y-6">
                    <CalendarPanel selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <MiniModulePanel
                        tasks={tasks}
                        onSelectModule={(date) => setSelectedDate(date)}
                    />
                </div>
                {/* Right: Schedule */}
                <div className="w-[75%]">
                    <ScheduleGrid
                        selectedDate={selectedDate}
                        tasks={tasks}
                        setTasks={setTasks}
                    />                </div>
            </main>
        );
    }

    return (
        <div className="relative w-full max-w-[1600px] px-6 mx-auto pb-28 space-y-10">

            <div className="flex items-center justify-center w-full max-w-[900px] mx-auto gap-2">
                {/* Back Button */}
                {step > 1 ? (
                    <button
                        onClick={handleBack}
                        className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                    >
                        &lt;
                    </button>
                ) : (
                    <div className="w-[44px] h-[40px] mt-4" /> // Placeholder for alignment (matches button size)
                )}

                {/* Progress Bar with fixed width */}
                <div className="w-[800px]">
                    <StepProgressBar currentStep={step - 1} />
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    className={`mt-5 px-4 py-2 font-bold rounded-lg ${(step === 1 && !hasResume) ||
                        (step === 2 && !hasSkills) ||
                        (step === 3 && !hasTasks)
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        }`}
                    disabled={
                        (step === 1 && !hasResume) ||
                        (step === 2 && !hasSkills) ||
                        (step === 3 && !hasTasks)
                    }
                >
                    &gt;
                </button>
            </div>



            {step === 1 && (
                <div className="max-w-5xl px-6 mx-auto">
                    <StepResume userId={userId} onChange={() => setHasResume(true)} />
                </div>
            )}
            {step === 2 && <StepSkill userId={userId} onChange={() => setHasSkills(true)} />}
            {step === 3 && (
                <div className="px-6 mx-auto">
                    <StepSchedule
                        userId={userId}
                        onChange={() => setHasTasks(true)}
                        tasks={tasks}
                        setTasks={setTasks}
                    />
                </div>
            )}

        </div>
    );
}
