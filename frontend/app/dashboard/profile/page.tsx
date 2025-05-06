"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserData, fetchUserGoal, updateUserInfo } from "@/utils/api";
import Header from "@/components/ui/header";
import AuthProtected from "@/components/auth-protected";

export default function ProfilePage() {
    const router = useRouter();

    // ✅ User State
    const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
    const [newName, setNewName] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        const userName = localStorage.getItem("user_name");
        const userEmail = localStorage.getItem("user_email");

        if (!token || !userId) {
            router.push("/auth/signin");
            return;
        }
        const data = (userId && userName && userEmail) ? { id: Number(userId), name: userName, email: userEmail } : null;
        if (data && data.name) {
            setUser(data);
            setNewName(data.name);
        }

    }, [router]);

    // ✅ Update Name
    const handleUpdateName = async () => {
        if (!user) return;
        setMessage(null);

        try {
            await updateUserInfo(user.id, { name: newName }); // ✅ Use the unified function
            setMessage("✅ Name updated successfully!");
            setUser((prev) => prev ? { ...prev, name: newName } : prev); // ✅ Update local UI
            localStorage.setItem("user_name", newName);
        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
        }
    };

    return (
        <AuthProtected>
            <Header />
            <div className="max-w-3xl mx-auto p-10 bg-gray-900/80 text-white rounded-xl shadow-xl mt-10 w-[90%]">
                <h1 className="text-center text-3xl font-semibold text-indigo-200 mb-6">Profile</h1>
                <div className="mb-6">
                    <label className="block text-lg font-medium text-indigo-200">Email</label>
                    <input
                        type="email"
                        className="form-input w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed"
                        value={user?.email || ""}
                        disabled
                    />
                </div>

                {/* ✅ User Info Section */}
                <div className="mb-6">
                    <label className="block text-lg font-medium text-indigo-200">Name</label>
                    <input
                        type="text"
                        className="mb-3 form-input w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <button
                        onClick={handleUpdateName}
                        className="btn-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 transition cursor-pointer"
                    >
                        Update Name
                    </button>
                </div>


                {/* ✅ Change Password Button */}
                <div className="mb-6">
                    <label className="block text-lg font-medium text-indigo-200">Password</label>
                    <input
                        type="email"
                        className="mb-3 form-input w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed"
                        value={"********"}
                        disabled
                    />
                    <button
                        onClick={() => router.push("/auth/reset-password")}
                        className="btn-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 transition cursor-pointer"
                    >
                        Change Password
                    </button>
                </div>

                {/* ✅ Success/Error Message */}
                {message && <p className="mt-4 text-center text-lg text-indigo-400">{message}</p>}
            </div>
        </AuthProtected>
    );
}
