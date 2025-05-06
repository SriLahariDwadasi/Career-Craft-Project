"use client";

interface CareerGoalProps {
    jobTitle: string;
    setJobTitle: (title: string) => void;
    industry: string;
    setIndustry: (industry: string) => void;
    exp_level: string;
    setExpLevel: (level: string) => void;
    responsibility: string;
    setResponsibility: (value: string) => void;
}

export default function CareerGoal({
    jobTitle,
    setJobTitle,
    industry,
    setIndustry,
    exp_level,
    setExpLevel,
    responsibility,
    setResponsibility,
}: CareerGoalProps) {

    return (
        <>
            <h2 className="mb-8 animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                Your Dream Career
            </h2>

            {/* Job Title */}
            <p className="text-left px-3 mb-1 block text-lg text-indigo-200">Career Position</p>
            <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mb-6 mt-2 p-4 w-full rounded-lg bg-gray-800/40 text-white placeholder-white/70 text-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text"
                placeholder="e.g. Data Analyst"
            />

            {/* Industry */}
            <p className="text-left px-3 mb-1 block text-lg text-indigo-200">Industry</p>
            <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mb-6 mt-2 p-4 w-full rounded-lg bg-gray-800/40 text-white placeholder-white/70 text-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text"
                placeholder="e.g. Technology, Healthcare, Finance"
            />

            {/* Experience Level */}
            <p className="text-left px-3 mb-1 block text-lg text-indigo-200">Experience Level</p>
            <select
                value={exp_level}
                onChange={(e) => setExpLevel(e.target.value)}
                className="mb-6 mt-2 p-4 w-full rounded-lg bg-gray-800/40 text-white text-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
                <option className="cursor-pointer" value="" disabled hidden>
                    Choose Experience Level
                </option>
                <option className="cursor-pointer" value="Internship">Internship</option>
                <option className="cursor-pointer" value="Entry level">Entry level</option>
                <option className="cursor-pointer" value="Mid-Senior level">Mid-Senior level</option>
                <option className="cursor-pointer" value="Associate">Associate</option>
                <option className="cursor-pointer" value="Director">Director</option>
                <option className="cursor-pointer" value="Executive">Executive</option>
            </select>

            {/* Responsibilities */}
            <p className="text-left px-3 mb-1 block text-lg text-indigo-200">
                Responsibilities (Optional but Recommended)
            </p>
            <textarea
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                className="mt-2 p-4 w-full h-32 rounded-lg bg-gray-800/40 text-white placeholder-white/70 text-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none cursor-text"
                placeholder="e.g. Create data-driven insights through machine learning"
            />
        </>
    );
}
