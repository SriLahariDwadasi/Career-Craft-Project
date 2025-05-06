"use client";

import { motion } from "framer-motion";
interface StepNavigationProps {
    step: number;
    handlePrevStep: () => void;
    handleNextStep: () => void;
    handleConfirmSetup: () => void;
    jobTitle: string;
    industry: string;
    exp_level: string;
    duration: string;
    durationUnit: string;
    weeklyHours: string;
    studyDays: {
        isMonday: boolean;
        isTuesday: boolean;
        isWednesday: boolean;
        isThursday: boolean;
        isFriday: boolean;
        isSaturday: boolean;
        isSunday: boolean;
    };
    resumeFile: File | null;
    setResumeFile: (file: File | null) => void;
    notReadyChecked: boolean;
    setNotReadyChecked: (checked: boolean) => void;
}


export default function StepNavigation({
    step,
    handlePrevStep,
    handleNextStep,
    handleConfirmSetup,
    jobTitle,
    industry,
    exp_level,
    duration,
    durationUnit,
    weeklyHours,
    studyDays,
    resumeFile,
    setResumeFile,
    notReadyChecked,
    setNotReadyChecked,
}: StepNavigationProps) {
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        setResumeFile(file);
        setNotReadyChecked(false);
    };

    const handleNotReadyChange = async () => {
        const newValue = !notReadyChecked;
        setNotReadyChecked(newValue);

        if (newValue) {
            setResumeFile(null);
        } else {
            // ✅ Ensure file input can be used again by resetting it safely
            const fileInput = document.getElementById("resumeUploadInput") as HTMLInputElement;
            if (fileInput) fileInput.value = "";
        }
    };



    // ✅ Only disable "Next" if both conditions fail
    const isNextDisabled =
        (step === 1 && (jobTitle.trim() === "" || industry.trim() === "" || exp_level.trim() === "")) ||
        (step === 2 && duration.trim() === "") ||
        (step === 3 && (String(weeklyHours).trim() === "" || Number(weeklyHours) > 105 || !Object.values(studyDays).some(Boolean))) ||
        (step === 4 && !resumeFile && !notReadyChecked);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col items-center w-full"
        >
            {step === 4 && (
                <>
                    <h2 className="mb-8 animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                        Your Resume
                    </h2>
                    <div className="flex flex-col items-center">
                        {/* ✅ File Upload */}
                        <label className={`cursor-pointer px-3 py-1 rounded-lg ${notReadyChecked ? "bg-gray-500 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}>
                            Choose File
                            <input
                                id="resumeUploadInput"
                                type="file"
                                accept=".pdf,.docx,.txt"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={notReadyChecked}
                            />

                        </label>


                        {/* ✅ Show Uploaded File Name */}
                        {resumeFile && (
                            <p className="mt-3 text-green-400">✔ {resumeFile.name} uploaded successfully!</p>
                        )}
                        <p className="mb-5 mt-3 text-gray-300">Accepted format: PDF, DOCX, TXT</p>

                        {/* ✅ Not Ready Yet Checkbox */}
                        <label className="mt-4 flex items-center text-white text-lg">
                            <input
                                type="checkbox"
                                checked={notReadyChecked}
                                onChange={handleNotReadyChange}
                                className="mr-2 scale-125 rounded cursor-pointer"
                            />
                            <p className="indent-2">I'm not ready to upload my resume yet</p>
                        </label>
                    </div>
                </>
            )}

            {/* ✅ Navigation Buttons */}
            <div className="flex justify-end w-full mt-6">
                {step > 1 && (
                    <motion.button
                        onClick={handlePrevStep}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-lg cursor-pointer"
                    >
                        Back
                    </motion.button>
                )}
                <motion.button
                    onClick={step < 4 ? handleNextStep : handleConfirmSetup}
                    className={`px-6 py-3 ml-4 rounded-lg text-lg ${isNextDisabled ? "bg-gray-500 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"}`}
                    disabled={isNextDisabled}
                >
                    {step < 4 ? "Next" : "Confirm"}
                </motion.button>
            </div>
        </motion.div>
    );
}
