"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-muted via-[#5477BE] to-[#002E4E] overflow-hidden">
      {/* Left Side - Branding (Static) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/assets/logo/focusflow_logo.svg"
              alt="Focus Flow"
              width={64}
              height={64}
              priority
            />
            <h1 className="text-6xl font-black text-white tracking-tight">
              FOCUS FLOW
            </h1>
          </div>
          <p className="text-2xl text-white/90 font-light tracking-wide">
            Let Work — and People — Flow.
          </p>
        </div>
      </div>

      {/* Right Side - Form (Slides in) */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: showForm ? "0%" : "100%" }}
        transition={{
          duration: 0.8,
          ease: [0.6, 0.05, 0.01, 0.9],
        }}
        className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-gray-50 rounded-l-3xl lg:-ml-6"
      >
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image
                src="/assets/logo/focusflow_logo.svg"
                alt="Focus Flow"
                width={48}
                height={48}
              />
              <h1 className="text-4xl font-black text-primary">FOCUS FLOW</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Let Work — and People — Flow.
            </p>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: " rounded-3xl",
              },
            }}
            routing="path"
            path="/auth/login"
            signUpUrl="/auth/signup"
          />
        </div>
      </motion.div>
    </div>
  );
}
