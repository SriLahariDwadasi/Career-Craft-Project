"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/ui/header";
import { loginUser } from "@/utils/api";

export default function SignIn() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const data = await loginUser(formData.email, formData.password);
      localStorage.clear();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("user_name", data.user_name);
      setMessage("✅ Login successful! Redirecting...");
      router.push("/dashboard");
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto p-10 bg-gray-500/50 text-white rounded-xl shadow-xl mt-10 w-[90%] md:w-[50%] lg:w-[35%] backdrop-blur-md">
        <div className="pb-10 text-center">
          <h1 className="text-3xl font-semibold text-indigo-200 md:text-4xl">
            Welcome back
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-indigo-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your email"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor="password" className="block text-sm font-medium text-indigo-200">
                Password
              </label>
              <Link href="/auth/reset-password" className="text-sm text-indigo-300 hover:underline">
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition cursor-pointer"
          >
            Sign in
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-white/80">{message}</p>
        )}

        <div className="mt-6 text-center text-sm text-indigo-200">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-indigo-400 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
