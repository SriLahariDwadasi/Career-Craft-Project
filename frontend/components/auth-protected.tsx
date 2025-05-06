"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthProtected({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/auth/signin"); // Redirect if no token is found
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (!isAuthenticated) {
        return null; // Prevent unauthorized content from flashing
    }

    return <>{children}</>; // Render protected content
}
