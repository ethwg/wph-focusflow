"use client";

import { useEffect, useState } from "react";

interface ManagedTeam {
  team_id: number;
  org_id: number;
  name: string;
  invite_code: string | null;
  members: Record<string, unknown>;
  manager_id: number | null;
  created_at: string;
}

interface ManagerStatusResponse {
  isManager: boolean;
  managedTeams?: ManagedTeam[];
}

export function useIsManager() {
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [managedTeams, setManagedTeams] = useState<ManagedTeam[]>([]);

  useEffect(() => {
    async function checkManagerStatus() {
      try {
        const response = await fetch("/api/user/is-manager");
        if (response.ok) {
          const data: ManagerStatusResponse = await response.json();
          setIsManager(data.isManager);
          setManagedTeams(data.managedTeams || []);
        }
      } catch (error) {
        console.error("Error checking manager status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkManagerStatus();
  }, []);

  return { isManager, isLoading, managedTeams };
}
