"use client";

import { useOnboarding } from "@/context/onboarding/onboarding-context";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface Role {
  role_id: number;
  name: string;
  department: string;
}

export function PositionStep() {
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    () => {
      if (!onboardingData.position) return null;

      return parseInt(onboardingData.position, 10);
    },
  );

  useEffect(() => {
    // Fetch roles based on selected department
    const fetchRoles = async () => {
      if (!onboardingData.department) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/onboarding/roles?department=${encodeURIComponent(onboardingData.department)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles || []);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [onboardingData.department]);

  const handlePositionSelect = (roleId: number) => {
    setSelectedPosition(roleId);
    updateOnboardingData({ position: roleId.toString() });
  };

  if (!onboardingData.department) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Please select a department first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          What position are you at?
        </h2>

        {/* Position Selection Pills */}
        <div className="flex flex-wrap gap-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-12 w-40 rounded-full border bg-muted/50 animate-pulse"
              />
            ))
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No positions available for this department.
            </p>
          ) : (
            roles.map((role) => {
              const isSelected = selectedPosition === role.role_id;

              return (
                <Button
                  key={role.role_id}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-12 px-6 rounded-full text-base font-normal transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => handlePositionSelect(role.role_id)}
                >
                  {role.name}
                </Button>
              );
            })
          )}
        </div>

        {/* Helper Text */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your position tells us what you usually work with.
        </p>
      </div>
    </div>
  );
}
