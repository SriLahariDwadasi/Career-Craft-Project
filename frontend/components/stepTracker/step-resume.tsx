"use client";

import { useEffect, useState } from "react";
import {
    fetchResumeUrl,
    fetchUserGoal,
    updateUserGoal,
    saveResumeFile,
} from "@/utils/api";
import { API_BASE_URL } from "@/utils/api";

export default function StepResume({ userId, onChange }: { userId: number; onChange: () => void }) {
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isNextDisabled, setIsNextDisabled] = useState(true);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    useEffect(() => {
        fetchResumeUrl(userId)
            .then(setResumeUrl)
            .catch(() => setResumeUrl(null))
            .finally(() => setLoading(false));
    }, [userId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setResumeFile(file);
        setIsNextDisabled(false);
        setShowSuccessMessage(true);
    };

    const handleConfirmUpload = async () => {
        if (!resumeFile) return;

        try {
            const goal = await fetchUserGoal(userId);
            await updateUserGoal(userId, goal);
            await saveResumeFile(userId, resumeFile);
            fetchResumeUrl(userId)
                .then(setResumeUrl)
                .catch(() => setResumeUrl(null));

            setShowSuccessMessage(false);
            setIsNextDisabled(true);
            if (onChange) onChange();
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-300 p-10">Loading resume...</div>;
    }

    if (!resumeUrl) {
        return (
            <div className="mt-10 flex flex-col items-center justify-center w-[95%] h-[65vh] mx-auto bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl text-indigo-200 text-lg p-6 space-y-4 shadow-xl">
                <div className="text-xl font-semibold">No resume uploaded yet.</div>

                <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition">
                    Upload Resume
                    <input
                        id="resumeUploadInput"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </label>

                {showSuccessMessage && resumeFile && (
                    <p className="text-green-400">✔ {resumeFile.name} uploaded successfully!</p>
                )}

                <p className="text-sm text-indigo-100">Accepted format: PDF, DOCX, TXT</p>

                <button
                    onClick={handleConfirmUpload}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition ${isNextDisabled
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-indigo-500 hover:bg-indigo-600 cursor-pointer"
                        }`}
                    disabled={isNextDisabled}
                >
                    Confirm
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-hidden bg-white/20 backdrop-blur-md rounded-xl shadow-xl p-6">
            <div className="mb-5">
                <div className="flex items-start justify-between">
                    <h2 className="text-3xl font-bold text-indigo-200">Resume Preview</h2>

                    <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-3">
                            <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition">
                                Update Resume
                                <input
                                    id="resumeUploadInput"
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>

                            <button
                                onClick={handleConfirmUpload}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${isNextDisabled
                                    ? "bg-gray-500 cursor-not-allowed"
                                    : "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
                                    }`}
                                disabled={isNextDisabled}
                            >
                                Confirm
                            </button>
                        </div>

                        {showSuccessMessage && resumeFile && (
                            <p className="text-green-400 text-sm">✔ {resumeFile.name} uploaded successfully!</p>
                        )}
                        <p className="text-sm text-indigo-100">Accepted format: PDF, DOCX, TXT</p>
                    </div>
                </div>
            </div>

            {resumeUrl?.endsWith(".pdf") || resumeUrl?.endsWith(".txt") ? (
                <iframe
                    src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=100`}
                    className="w-full h-[65vh] rounded-lg shadow-md"
                    style={{
                        border: "none",
                        margin: 0,
                        padding: 0,
                    }}
                    title="Resume Preview"
                />
            ) : (
                <div className="flex items-center justify-center w-full h-[65vh] bg-gray-900/40 text-indigo-300 border border-gray-600 rounded-lg text-xl font-semibold">
                    No preview available for DOCX file type.
                </div>
            )}
        </div>
    );
}
