export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// ✅ Define SignupFormData interface (Same structure as in signup/page.tsx)
interface SignupFormData {
    name: string;
    email: string;
    password: string;
    security_question: string;
    security_answer: string;
}

export async function fetchUserData(userId: string, token: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/user-login/${userId}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user data");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}

// ✅ Fetch User Goal
export const fetchUserGoal = async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/user-goal/${userId}/`);
    if (!response.ok) throw new Error("Failed to fetch user goal");
    return response.json();
};

// ✅ Update User Goal (Includes Resume Text)
export const updateUserGoal = async (userId: number, goalData: any) => {
    const response = await fetch(`${API_BASE_URL}/user-goal/${userId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
    });
    if (!response.ok) throw new Error("Failed to update user goal");
    return response.json();
};

// ✅ Save Resume File
export const saveResumeFile = async (userId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/user-goal/save-resume/${userId}/`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) throw new Error("Failed to save resume");
    return response.json();
};

// ✅ Remove Resume File
export const removeResumeFile = async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/user-goal/remove-resume/${userId}/`, {
        method: "POST",
    });

    if (!response.ok) throw new Error("Failed to remove resume");
    return response.json();
};

// ✅ Get Resume File Url
export const fetchResumeUrl = async (userId: number): Promise<string | null> => {
    const response = await fetch(`${API_BASE_URL}/user-goal/get-resume-url/${userId}/`);
    if (response.ok) {
        const data = await response.json();
        return `${API_BASE_URL}${data.url}`;
    } else {
        return null;
    }
};

// ✅ Unified Function for Updating User Info (Name, Password, or Future Fields)
export const updateUserInfo = async (userId: number, updateFields: any) => {
    const token = localStorage.getItem("access_token"); // ✅ Get token once
    if (!token) throw new Error("Unauthorized: No access token found");

    try {
        const response = await fetch(`${API_BASE_URL}/user-login/update/${userId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updateFields),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to update user info");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating user info:", error);
        throw error;
    }
};
// ✅ Fetch Security Question
export const fetchSecurityQuestion = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/user-login/reset-password/question?email=${email}/`);
    if (!response.ok) throw new Error("Email not found");
    return response.json();
};

// ✅ Verify Security Answer
export const verifySecurityAnswer = async (email: string, securityAnswer: string) => {
    const response = await fetch(`${API_BASE_URL}/user-login/reset-password/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, security_answer: securityAnswer }),
    });

    if (!response.ok) throw new Error("Incorrect security answer");
    return response.json();
};


// ✅ User Login
export const loginUser = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/user-login/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Login failed");
    return data; // ✅ Return token & user_id
};

// ✅ User Registration
export const registerUser = async (formData: SignupFormData) => {
    const response = await fetch(`${API_BASE_URL}/user-login/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Signup failed");
    return data; // ✅ Return success message or response data
};

export async function fetchLearnSkill(userId: number) {
    console.log(userId);
    const res = await fetch(`${API_BASE_URL}/learn-skill/${userId}/`);
    if (!res.ok) {
        throw new Error("Failed to fetch learning skills");
    }
    return await res.json();
}

export async function updateLearnSkill(userId: number, skills: any[]) {
    const res = await fetch(`${API_BASE_URL}/learn-skill/${userId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(skills),
    });

    if (!res.ok) {
        throw new Error("Failed to update learning skills");
    }
    return await res.json();
}

// ✅ Fetch scheduled tasks for a user
export async function fetchScheduledTasks(userId: number) {
    const res = await fetch(`${API_BASE_URL}/scheduled-tasks/${userId}/`);

    if (!res.ok) {
        throw new Error("Failed to fetch scheduled tasks");
    }

    return await res.json();
}

// ✅ Replace scheduled tasks for a user
export async function updateScheduledTasks(userId: number, tasks: any[]) {
    const res = await fetch(`${API_BASE_URL}/scheduled-tasks/${userId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tasks),
    });

    if (!res.ok) {
        throw new Error("Failed to update scheduled tasks");
    }
    return await res.json();
}

export async function generateScheduledTasks(userId: number) {
    const response = await fetch(`${API_BASE_URL}/generate-scheduled-tasks/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
        throw new Error("Failed to generate scheduled tasks");
    }

    return await response.json(); // returns the list of generated tasks
}

export async function generateLearnSkill(userId: number) {
    const response = await fetch(`${API_BASE_URL}/generate-learn-skills/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) throw new Error("Failed to generate skills");
    return await response.json().then(res => res.skills);
}



export interface MapPoint {
    name: string;
    avgSalary: number;
    lat: number;
    lng: number;
}

/**
 * Fetches aggregated map points from the backend.
 *
 * @param mode      "CITY" or "STATE" geography
 * @param minSalary minimum salary filter
 * @param maxSalary maximum salary filter
 * @param q         optional job‐title keyword for semantic filtering
 */
export async function fetchMapData(
    mode: "CITY" | "STATE",
    minSalary: number,
    maxSalary: number,
    q?: string
): Promise<MapPoint[]> {
    const params = new URLSearchParams({
        mode,
        minSalary: minSalary.toString(),
        maxSalary: maxSalary.toString(),
    });
    if (q && q.trim() !== "") {
        params.set("q", q.trim());
    }
    const res = await fetch(`${API_BASE_URL}/map/?${params.toString()}`);
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Map fetch failed: ${err}`);
    }
    return res.json();
}

export async function updateScheduledTaskStatus(taskId: number, status: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/scheduled-tasks/${taskId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });

    if (!res.ok) {
        throw new Error(`Failed to update status for task ${taskId}`);
    }
}

export async function clearAllUserCache(userId: number): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/user-logout/${userId}/`, {
            method: "POST",
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to clear user cache: ${errorText}`);
        }
    } catch (error) {
        console.error("Error clearing user cache:", error);
        throw error;
    }
}