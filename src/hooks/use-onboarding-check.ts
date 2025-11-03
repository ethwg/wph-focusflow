import { useEffect, useState } from "react";
import { useUserProfile } from "./useUserProfile";

interface OnboardingStatus {
  needsOnboarding: boolean;
  missingFields: string[];
  isLoading: boolean;
}

export function useOnboardingCheck(): OnboardingStatus {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (!isProfileLoading && profile) {
      const missing: string[] = [];

      // Check if org_id is -1 or null
      if (profile.org_id === -1 || profile.org_id === null) {
        missing.push("organization");
      }

      // Check if team_id is -1 or null
      if (profile.team_id === -1 || profile.team_id === null) {
        missing.push("team");
      }

      // Check if role_id is -1 or null
      if (profile.role_id === -1 || profile.role_id === null) {
        missing.push("role");
      }

      setMissingFields(missing);
      setNeedsOnboarding(missing.length > 0);
    }
  }, [profile, isProfileLoading]);

  return {
    needsOnboarding,
    missingFields,
    isLoading: isProfileLoading,
  };
}
