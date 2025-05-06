"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchUserData, updateUserInfo, fetchSecurityQuestion, verifySecurityAnswer } from "@/utils/api";
import Header from "@/components/ui/header";

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (token && userId) {
      setIsLoggedIn(true);
      fetchUserData(userId, token)
        .then((data) => {
          if (data?.email) setEmail(data.email);
        })
        .catch((err) => console.error("Failed to fetch user data:", err));
    }
  }, []);

  const handleRequestQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const data = await fetchSecurityQuestion(email);
      setSecurityQuestion(data.security_question);
      setStep(2);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await verifySecurityAnswer(email, securityAnswer);
      setStep(3);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setMessage("❌ Error: User ID not found. Please log in again.");
      return;
    }

    try {
      await updateUserInfo(Number(userId), { new_password: newPassword });
      setMessage("✅ Password reset successful! Redirecting...");
      setTimeout(() => {
        router.push(isLoggedIn ? "/dashboard/profile" : "/auth/signin");
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <>
      <Header />
      <section>
        <div className="max-w-3xl mx-auto p-10 bg-gray-500/50 text-white rounded-xl shadow-xl mt-10 w-[90%] md:w-[50%] lg:w-[35%] backdrop-blur-md">
          <div className="pb-10 text-center">
            <h1 className="text-3xl font-semibold text-indigo-200 md:text-4xl">
              Reset your password
            </h1>
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleRequestQuestion}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-indigo-200">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggedIn}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition cursor-pointer"
              >
                Next
              </button>
            </form>
          )}

          {/* Step 2: Security Question */}
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleVerifyAnswer}>
              <div>
                <label className="block text-sm font-medium text-indigo-200">
                  {securityQuestion} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition cursor-pointer"
              >
                Verify Answer
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-indigo-200">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition cursor-pointer"
              >
                Reset Password
              </button>
            </form>
          )}

          {message && (
            <p className="mt-4 text-center text-white/80">{message}</p>
          )}
        </div>
      </section>
    </>
  );
}
