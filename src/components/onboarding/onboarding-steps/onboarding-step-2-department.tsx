"use client";

import { useOnboarding } from "@/context/onboarding/onboarding-context";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function DepartmentStep() {
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    onboardingData.department || null,
  );

  useEffect(() => {
    // Fetch unique departments from roles table
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/onboarding/departments");
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        // Fallback to default departments if fetch fails
        setDepartments([
          "Development",
          "Design",
          "Sales & Marketing",
          "Finance",
          "HR",
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
    updateOnboardingData({ department });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          What department are you in?
        </h2>

        {/* Department Selection Pills */}
        <div className="flex flex-wrap gap-3">
          {isLoading
            ? // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 w-32 rounded-full border bg-muted/50 animate-pulse"
                />
              ))
            : departments.map((department) => {
                const isSelected = selectedDepartment === department;

                return (
                  <Button
                    key={department}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-12 px-6 rounded-full text-base font-normal transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    onClick={() => handleDepartmentSelect(department)}
                  >
                    {department}
                  </Button>
                );
              })}
        </div>

        {/* Helper Text */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your department selection decides which team dashboard you can view.
        </p>
      </div>
    </div>
  );
}
