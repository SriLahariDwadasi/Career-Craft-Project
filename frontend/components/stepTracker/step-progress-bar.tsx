import React from "react";

const steps = [
    "Resume",
    "Skill",
    "Schedule",
];

export default function StepProgressBar({ currentStep }: { currentStep: number }) {
    return (
        <div className="w-full flex flex-col items-center pt-6">
            {/* Top Bar: Circles + Lines */}
            <div className="flex justify-between w-full max-w-4xl px-8">
                {steps.map((label, i) => {
                    const isCompleted = i < currentStep;
                    const isCurrent = i === currentStep;

                    return (
                        <div key={i} className="flex-1 flex flex-col items-center relative">
                            {/* Circle */}
                            <div className="z-10">
                                <div
                                    className={`w-40 h-10 flex items-center justify-center rounded-full border-2 text-md text-center font-bold
                                    ${isCompleted ? "bg-indigo-500 text-white border-indigo-500" : ""}
                                    ${isCurrent ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300" : ""}
                                    ${!isCompleted && !isCurrent ? "bg-gray-700 text-white border-gray-500" : ""}`}
                                >
                                    {label}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {i < steps.length - 1 && (
                                <div className="absolute top-4 left-1/2 w-full h-2 z-0">
                                    <div className={`w-full h-full ${i < currentStep ? "bg-indigo-500" : "bg-gray-600"}`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
