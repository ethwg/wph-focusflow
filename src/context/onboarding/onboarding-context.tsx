"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface OnboardingData {
  department: string | null;
  position: string | null;
  tools: string[];
  teamCode: string | null;
  teamCodeValid?: boolean | null;
}

interface OnboardingContextType {
  currentStep: number;
  onboardingData: OnboardingData;
  setCurrentStep: (step: number) => void;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    department: null,
    position: null,
    tools: [],
    teamCode: null,
    teamCodeValid: null,
  });

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const resetOnboarding = () => {
    setCurrentStep(0);
    setOnboardingData({
      department: null,
      position: null,
      tools: [],
      teamCode: null,
      teamCodeValid: null,
    });
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        onboardingData,
        setCurrentStep,
        updateOnboardingData,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
