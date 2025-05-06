"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import CareerGoal from "@/components/dashboard/career-goal";
import LearningDuration from "@/components/dashboard/learning-duration";
import WeeklyHours from "@/components/dashboard/weekly-hours";
import StepNavigation from "@/components/dashboard/step-navigation";
import AuthProtected from "@/components/auth-protected";
import { fetchUserGoal, saveResumeFile, updateUserGoal } from "@/utils/api"; // ✅ Use API utility
import SalaryMap from "@/components/dashboard/salary-map";
import dynamic from "next/dynamic";
import ModuleProgressPanel from "@/components/dashboard/module-progress";

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [userId, setUserId] = useState(-1);

  // Setup Form States
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [exp_level, setExpLevel] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("weeks");
  const [weeklyHours, setWeeklyHours] = useState("");
  type StudyDays = {
    isMonday: boolean;
    isTuesday: boolean;
    isWednesday: boolean;
    isThursday: boolean;
    isFriday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
  };

  const initialStudyDays: StudyDays = {
    isMonday: false,
    isTuesday: false,
    isWednesday: false,
    isThursday: false,
    isFriday: false,
    isSaturday: false,
    isSunday: false,
  };

  const [studyDays, setStudyDays] = useState<StudyDays>(initialStudyDays);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [notReadyChecked, setNotReadyChecked] = useState(false);

  // ✅ Check if User is Authenticated and Fetch Goal
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");
    setUserId(Number(userId));

    if (!token || !userId) {
      router.push("/auth/signin");
      return;
    }
    setIsAuthenticated(true);

    // ✅ Fetch User Goal
    fetchUserGoal(Number(userId))
      .then((goalData) => {
        if (goalData) {
          setIsSetupComplete(true);

        }
      })
      .catch(() => console.error("Failed to fetch goal"))
      .finally(() => setIsLoading(false));
  }, [router]);

  // ✅ Loading State
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white text-lg">Loading...</div>;
  }

  // ✅ Handle Step Navigation
  const handleNextStep = () => {
    if (
      (step === 1 && jobTitle.trim() === "" && industry.trim() === "" && exp_level.trim() === "") ||
      (step === 2 && duration.trim() === "") ||
      (step === 3 && (String(weeklyHours).trim() === "" || Number(weeklyHours) > 105 || !Object.values(studyDays).some(Boolean))) ||
      (step === 4 && !resumeFile && !notReadyChecked)
    ) {
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = async () => {
    setStep(step - 1);
    setResumeFile(null);
    // ✅ Ensure file input can be used again by resetting it safely
    const fileInput = document.getElementById("resumeUploadInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // ✅ Handle Final Setup Confirmation
  const handleConfirmSetup = async () => {
    const userId = localStorage.getItem("user_id");

    const goalData = {
      target_position: jobTitle,
      industry: industry,
      exp_level: exp_level,
      responsibility: (responsibility == "") ? null : responsibility,
      duration_weeks: durationUnit === "weeks" ? Number(duration) : durationUnit === "months" ? Number(duration) * 4 : Number(duration) * 52,
      weekly_hours: Number(weeklyHours),
      ...studyDays, // Spread selected weekdays
    };
    console.log(goalData);

    try {
      await updateUserGoal(Number(userId), goalData);
      if (resumeFile) {
        await saveResumeFile(Number(userId), resumeFile);
      }
      setIsSetupComplete(true);
      window.location.reload();
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };
  const SalaryMap = dynamic(
    () => import('@/components/dashboard/salary-map'),
    { ssr: false }
  )

  return (
    <>
      {!isSetupComplete ? (
        <AuthProtected>
          <Header />
          <div className="relative flex flex-col items-center justify-start min-h-screen text-white overflow-hidden w-full pt-5 px-4">
            <section className="text-center bg-gray-500/50 backdrop-blur-md bg-opacity-80 p-8 md:p-10 rounded-2xl shadow-2xl max-w-3xl w-full mt-2 transition-all duration-300">
              {step === 1 && (
                <CareerGoal
                  jobTitle={jobTitle}
                  setJobTitle={setJobTitle}
                  industry={industry}
                  setIndustry={setIndustry}
                  exp_level={exp_level}
                  setExpLevel={setExpLevel}
                  responsibility={responsibility}
                  setResponsibility={setResponsibility}
                />
              )}
              {step === 2 && (
                <LearningDuration
                  duration={duration}
                  setDuration={setDuration}
                  durationUnit={durationUnit}
                  setDurationUnit={setDurationUnit}
                />
              )}
              {step === 3 && (
                <WeeklyHours
                  weeklyHours={weeklyHours}
                  setWeeklyHours={setWeeklyHours}
                  studyDays={studyDays}
                  setStudyDays={setStudyDays}
                />
              )}

              {/* ✅ Step Navigation Always Visible */}
              <StepNavigation
                step={step}
                handlePrevStep={handlePrevStep}
                handleNextStep={handleNextStep}
                handleConfirmSetup={handleConfirmSetup}
                jobTitle={jobTitle}
                industry={industry}
                exp_level={exp_level}
                duration={duration}
                durationUnit={durationUnit}
                weeklyHours={weeklyHours}
                studyDays={studyDays}
                resumeFile={resumeFile}
                setResumeFile={setResumeFile}
                notReadyChecked={notReadyChecked}
                setNotReadyChecked={setNotReadyChecked}
              />
            </section>
          </div>
        </AuthProtected>



      ) : (
        <AuthProtected>
          <Header />
          <main className="mt-1 flex flex-row w-full min-h-screen p-3 gap-6">
            {/* Left: Resume */}
            <div className="w-[50%] flex justify-center">
              <div className="w-[95%]">
                <SalaryMap />
              </div>
            </div>

            {/* Right: Your career goal components go here */}
            <div className="w-[50%]">
              <div className="w-[98%]">
                <ModuleProgressPanel userId={userId} />
              </div>
            </div>
          </main>
        </AuthProtected>
      )
      }

    </>
  );
}
