"use client";

import React from "react";

export default function WarningModal({
    isOpen,
    message,
    onCancel,
    onConfirm,
}: {
    isOpen: boolean;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed rounded-xl inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl text-gray-800">
                <h2 className="text-lg font-bold mb-4 text-red-600">⚠️ Warning</h2>
                <p className="text-sm mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg font-bold bg-gray-300 cursor-pointer text-gray-800 hover:bg-gray-400 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg font-bold cursor-pointer bg-red-600 text-white hover:bg-red-400 transition"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
