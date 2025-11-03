"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingCheck } from "@/hooks/use-onboarding-check";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/context/onboarding/onboarding-context";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { WelcomeStep } from "@/components/onboarding/onboarding-steps/onboarding-step-1-welcome";
import { DepartmentStep } from "@/components/onboarding/onboarding-steps/onboarding-step-2-department";
import { PositionStep } from "@/components/onboarding/onboarding-steps/onboarding-step-3-role";
import { ToolsStep } from "@/components/onboarding/onboarding-steps/onboarding-step-4-tools";
import { TeamJoinStep } from "@/components/onboarding/onboarding-steps/onboarding-step-5-team-join";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// Step Components - All imported above

const TOTAL_STEPS = 5;

function OnboardingContent() {
  const { currentStep, setCurrentStep, onboardingData, resetOnboarding } =
    useOnboarding();
  const { needsOnboarding, isLoading: isCheckingOnboarding } =
    useOnboardingCheck();
  const { refetch } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / TOTAL_STEPS) * 100;

  // Check if current step is valid
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Department
        return !!onboardingData.department;
      case 2: // Position
        return !!onboardingData.position;
      case 3: // Tools
        return true; // Tools are optional
      case 4: // Team Join
        // If user entered a code, it must be valid
        // If no code entered, that's fine (optional)
        if (onboardingData.teamCode && onboardingData.teamCode.length === 8) {
          return onboardingData.teamCodeValid === true;
        }
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Get role_id from position (assuming position contains role_id)
      const roleId = onboardingData.position;

      // Get team and org info from team join step
      const teamData = onboardingData.teamCode
        ? await validateTeamCode(onboardingData.teamCode)
        : null;

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: roleId,
          toolIds: onboardingData.tools,
          teamId: teamData?.team_id || null,
          orgId: teamData?.org_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      toast.success("Welcome aboard! Your profile is all set up.");

      // Refetch user profile to update UI
      await refetch();

      // Reset onboarding state
      resetOnboarding();
      setIsOpen(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateTeamCode = async (inviteCode: string) => {
    try {
      const response = await fetch("/api/onboarding/team/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.team;
    } catch (error) {
      console.error("Error validating team code:", error);
      return null;
    }
  };

  // Don't show dialog if loading or no onboarding needed
  if (isCheckingOnboarding || !needsOnboarding) {
    return null;
  }

  // Prevent closing the dialog (user must complete onboarding)
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if onboarding is complete
    if (!needsOnboarding) {
      setIsOpen(open);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <DepartmentStep />;
      case 2:
        return <PositionStep />;
      case 3:
        return <ToolsStep />;
      case 4:
        return <TeamJoinStep />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <Dialog open={isOpen && needsOnboarding} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto [&>button]:hidden"
        // Prevent closing by clicking outside or pressing escape
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle></DialogTitle>

          <div className="flex items-center justify-start pb-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-11 w-11">
                  <Image
                    src="/assets/logo/focusflow_logo.svg"
                    alt="Focus Flow"
                    fill
                    priority
                    className="object-contain"
                  />
                </div>
                <span className="text-primary text-xl font-semibold tracking-tight">
                  FOCUS FLOW
                </span>
              </Link>
            </motion.div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="py-6">{renderStep()}</div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {!isLastStep ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingDialog() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
