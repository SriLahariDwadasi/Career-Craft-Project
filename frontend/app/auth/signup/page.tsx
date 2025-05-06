"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/ui/header";
import { registerUser } from "@/utils/api";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  security_question: string;
  security_answer: string;
}

const securityQuestions = [
  "What was the name of your first pet?",
  "What is the name of the city where you were born?",
  "What is your favorite book?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "What is your favorite food?",
  "What was the name of your first school?",
  "Who was your childhood best friend?",
];

export default function SignUp() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    security_question: "",
    security_answer: "",
  });

  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await registerUser(formData);
      setMessage("✅ Account created successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/auth/signin";
      }, 2000);
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
            Create an account
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-indigo-200">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-indigo-200">
              Email <span className="text-red-500">*</span>
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
            <label htmlFor="password" className="block text-sm font-medium text-indigo-200">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Password"
            />
          </div>

          <div>
            <label htmlFor="security_question" className="block text-sm font-medium text-indigo-200">
              Security Question <span className="text-red-500">*</span>
            </label>
            <select
              id="security_question"
              value={formData.security_question}
              onChange={handleChange}
              required
              className="w-full mt-1 w-full border border-gray-600 bg-gray-800/40 text-white rounded-lg text-lg cursor-pointer"
            >
              <option value="">Select a security question</option>
              {securityQuestions.map((question, index) => (
                <option key={index} value={question}>{question}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="security_answer" className="block text-sm font-medium text-indigo-200">
              Security Answer <span className="text-red-500">*</span>
            </label>
            <input
              id="security_answer"
              type="text"
              value={formData.security_answer}
              onChange={handleChange}
              required
              className="w-full mt-1 rounded-md bg-gray-800/40 text-white placeholder-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your answer"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition cursor-pointer"
          >
            Register
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-white/80">{message}</p>
        )}

        <div className="mt-6 text-center text-sm text-indigo-200">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-medium text-indigo-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
}
