"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import Features from "@/components/landing/features";
import Header from "@/components/ui/header";
export default function Home() {
  useEffect(() => {
    AOS.init({ once: true });
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[100vh] flex items-center justify-center text-center text-white bg-black">
        {/* Header overlays video */}
        <div className="absolute top-0 left-0 w-full z-30">
          <Header />
        </div>

        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-5"
        >
          <source src="https://cdn.jsdelivr.net/gh/jackchen20010511/videos/background.mp4" type="video/mp4" />
        </video>
        {/* top and bottom “soften” fades */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 z-10" />
          {/* bottom-up fade on video */}
          <div className="absolute bottom-0 left-0 w-full h-30 bg-gradient-to-t from-black/80 to-transparent" />
          {/* top-down fade over video */}
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/100 to-transparent" />
        </div>

        {/* Hero Content */}
        <div
          className="z-20 px-4"
          data-aos="fade-up"
          data-aos-duration="300"
        >
          <h1 className="mb-5 mt-10 animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-7xl font-semibold text-transparent">
            Built for Personalized <br />
            <span className="block mt-4">Career Growth</span>
          </h1>
          <p className="text-lg text-indigo-100/100 max-w-md mx-auto">
            Your personalized roadmap to career success <br />
            — powered by AI, driven by you.
          </p>
        </div>
      </section>
      <section
        className="
          relative
          h-[100vh]
          flex items-center justify-center
          pt-16    /* shrink the top fade height */
          pb-20
          before:absolute before:top-0 before:left-0 before:w-full before:h-20
          before:bg-gradient-to-b before:from-black/100 before:to-transparent
          z-10
        "      >
        <Features />
      </section >
    </>
  );
}
