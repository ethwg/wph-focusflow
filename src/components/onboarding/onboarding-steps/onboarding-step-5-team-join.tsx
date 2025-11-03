"use client";

import { useOnboarding } from "@/context/onboarding/onboarding-context";
import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function TeamJoinStep() {
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [inviteCode, setInviteCode] = useState(onboardingData.teamCode || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean | null;
    teamName: string | null;
    error: string | null;
  }>({
    valid: null,
    teamName: null,
    error: null,
  });

  const validateTeamCode = async (code: string) => {
    if (code.length !== 8) {
      setValidationStatus({ valid: null, teamName: null, error: null });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/onboarding/team/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setValidationStatus({
          valid: true,
          teamName: data.team.name,
          error: null,
        });
        // Update context with validation status
        updateOnboardingData({ teamCodeValid: true });
      } else {
        setValidationStatus({
          valid: false,
          teamName: null,
          error: data.error || "Invalid invite code",
        });
        // Update context with validation status
        updateOnboardingData({ teamCodeValid: false });
      }
    } catch (error) {
      console.error("Error validating code:", error);
      setValidationStatus({
        valid: false,
        teamName: null,
        error: "Failed to validate code",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setInviteCode(value);

    // Validate when code is complete
    if (value.length === 8) {
      validateTeamCode(value);
    } else {
      setValidationStatus({ valid: null, teamName: null, error: null });
      // Clear validation status in context
      updateOnboardingData({ teamCodeValid: null });
    }
  };

  // Update context when invite code changes
  useEffect(() => {
    updateOnboardingData({ teamCode: inviteCode });
  }, [inviteCode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Have a team invitation code?{" "}
        </h2>

        {/* OTP Input */}
        <div className="flex justify-start py-6">
          <InputOTP
            maxLength={8}
            value={inviteCode}
            onChange={handleCodeChange}
            className="gap-3"
            disabled={isValidating}
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot
                index={0}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
              <InputOTPSlot
                index={1}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
              <InputOTPSlot
                index={2}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
              <InputOTPSlot
                index={3}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
            </InputOTPGroup>
            <InputOTPSeparator className="text-2xl" />
            <InputOTPGroup className="gap-2">
              <InputOTPSlot
                index={4}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
              <InputOTPSlot
                index={5}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
              <InputOTPSlot
                index={6}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
              <InputOTPSlot
                index={7}
                className="w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl"
              />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Validation Status */}
        {isValidating && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
            <span>Validating code...</span>
          </div>
        )}

        {!isValidating && validationStatus.valid === true && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="font-medium">Valid invite code!</p>
                <p className="text-sm">
                  You&#39;ll be joining:{" "}
                  <span className="font-semibold">
                    {validationStatus.teamName}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {!isValidating && validationStatus.valid === false && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <div>
                <p className="font-medium">Invalid invite code</p>
              </div>
            </div>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your invite code to join your team!
        </p>
      </div>
    </div>
  );
}
