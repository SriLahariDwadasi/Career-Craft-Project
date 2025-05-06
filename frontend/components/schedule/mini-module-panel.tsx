"use client";

import { ScheduledTask } from "@/components/stepTracker/step-schedule";

export default function MiniModulePanel({
    tasks,
    onSelectModule,
}: {
    tasks: ScheduledTask[];
    onSelectModule: (startDate: Date) => void;
}) {
    if (!tasks || tasks.length === 0) return null;

    const modules = Array.from(new Set(tasks.map((t) => t.module)));
    const grouped: { [module: number]: ScheduledTask[] } = {};
    modules.forEach((mod) => {
        grouped[mod] = tasks.filter((t) => t.module === mod);
    });

    return (
        <div className="p-2 text-white bg-white/40 rounded-xl text-white">
            <h2 className="mt-3 text-2xl font-bold text-center text-indigo-200 mb-6">Module Progress</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {modules.map((mod) => {
                    const modTasks = grouped[mod];
                    const total = modTasks.length;
                    const completed = modTasks.filter((t) => t.status === "completed").length;
                    const percent = Math.round((completed / total) * 100);
                    const firstDate = modTasks
                        .map((t) => {
                            const [y, m, d] = t.date.split("-").map(Number);
                            return new Date(y, m - 1, d); // ← FIXED
                        })
                        .sort((a, b) => a.getTime() - b.getTime())[0];

                    return (
                        <div
                            key={mod}
                            onClick={() => onSelectModule(firstDate)}
                            className="cursor-pointer h-[80px] px-4 py-2 bg-indigo-200/50 backdrop-blur-sm rounded-lg shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all"
                        >
                            <div className="mt-1 text-lg font-bold text-indigo-200 text-center">
                                Module {mod}
                            </div>

                            <div className="flex justify-end items-center mt-1 space-x-2">
                                <div className="w-[100px] h-3 bg-white/70 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <div className="text-indigo-600 font-semibold text-sm w-[30px] text-right">
                                    {percent}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
