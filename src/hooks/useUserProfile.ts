import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface PrivacySettings {
  [key: string]: unknown;
}

interface ToolConnections {
  [key: string]: unknown;
}

interface UserProfile {
  user_id: number;
  org_id: number;
  team_id: number | null;
  role_id: number | null;
  email: string;
  name: string;
  timezone: string | null;
  privacy_settings: PrivacySettings;
  tool_connections: ToolConnections;
  tracking_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!isClerkLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setProfile(data.user);
      setIsAdmin(data.isAdmin || false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn]);

  return {
    profile,
    isAdmin,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
