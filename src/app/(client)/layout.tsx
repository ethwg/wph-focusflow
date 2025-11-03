import { ReactNode } from "react";
import { Metadata } from "next";
import { NavHeader } from "@/components/shared/client-header/nav-header";
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper";

export const metadata: Metadata = {
  title: "Focus Flow",
  description: "Focus Flow",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <OnboardingWrapper>
        <NavHeader />
        <div className="px-3 ">{children}</div>
      </OnboardingWrapper>
    </div>
  );
}
