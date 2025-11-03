"use client";

import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog-parent";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  return (
    <>
      {children}
      <OnboardingDialog />
    </>
  );
}
