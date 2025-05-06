"use client";

import { useEffect, useState } from "react";
import { fetchResumeUrl, fetchUserGoal, updateUserGoal, saveResumeFile } from "@/utils/api";

interface ResumePreviewProps {
    userId?: number;
}

export default function ResumePreview({ userId }: ResumePreviewProps) {
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isNextDisabled, setIsNextDisabled] = useState(true);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    useEffect(() => {
        const id = userId || Number(localStorage.getItem("user_id"));
        if (!id) return;

        fetchResumeUrl(id)
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
        const userId = localStorage.getItem("user_id");
        if (!resumeFile) return;

        try {
            const goal = await fetchUserGoal(Number(userId));
            await updateUserGoal(Number(userId), goal);
            await saveResumeFile(Number(userId), resumeFile);
            fetchResumeUrl(Number(userId))
                .then(setResumeUrl)
                .catch(() => setResumeUrl(null));
            setShowSuccessMessage(false);
            setIsNextDisabled(true);
            window.location.reload();
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-300 p-10">Loading resume...</div>;
    }

    if (!resumeUrl) {
        return (
            <div className="mt-2 w-full h-[75vh] p-6 bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl text-indigo-200 flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-semibold">No resume uploaded yet.</h2>
                <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white">
                    Upload Resume
                    <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </label>
                {showSuccessMessage && resumeFile && (
                    <p className="text-green-400">✔ {resumeFile.name} uploaded successfully!</p>
                )}
                <p className="text-sm text-indigo-100/60">Accepted format: PDF, DOCX, TXT</p>
                <button
                    onClick={handleConfirmUpload}
                    className={`px-4 py-2 rounded-lg text-white transition ${isNextDisabled
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
        <div className="p-4 bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl shadow-md text-white">
            <div className="mb-5 flex items-start justify-between">
                <h2 className="text-3xl font-bold text-indigo-200">Resume Preview</h2>
                <div className="flex flex-col items-end space-y-2">
                    <div className="flex gap-2">
                        <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                            Update Resume
                            <input
                                type="file"
                                accept=".pdf,.docx,.txt"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                        <button
                            onClick={handleConfirmUpload}
                            className={`px-4 py-2 rounded-lg font-semibold ${isNextDisabled
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
                    <p className="text-sm text-indigo-100/80">Accepted format: PDF, DOCX, TXT</p>
                </div>
            </div>

            {resumeUrl?.endsWith(".pdf") || resumeUrl?.endsWith(".txt") ? (
                <iframe
                    src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=95`}
                    className="w-full h-[65vh] rounded-lg shadow"
                    style={{ border: "none" }}
                    title="Resume Preview"
                />
            ) : (
                <div className="flex items-center justify-center h-[65vh] bg-gray-800/40 text-indigo-300 border border-gray-600 rounded-lg text-xl font-semibold">
                    No preview available for DOCX file type.
                </div>
            )}
        </div>
    );
}
