"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock3, AlertCircle } from "lucide-react";

interface ProjectAllocation {
  name: string;
  totalMinutes: number;
  time: string;
  hours: number;
  minutes: number;
  color: string;
}

interface ProjectTimeData {
  projects: ProjectAllocation[];
  summary: {
    totalProjects: number;
    totalMinutes: number;
    totalTime: string;
    weekStart: string;
    weekEnd: string;
  };
}

export function MainProjectTimeAllocationCard() {
  const [data, setData] = useState<ProjectTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectTimeAllocation();
  }, []);

  const fetchProjectTimeAllocation = async () => {
    try {
      const response = await fetch(
        "/api/dashboard/personal/project-time-allocation",
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch project time allocation",
        );
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error fetching project time allocation:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <Clock3 className="h-5 w-5 mr-2" /> Project Time Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <Clock3 className="h-5 w-5 mr-2" /> Project Time Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <Clock3 className="h-5 w-5 mr-2" /> Project Time Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No project time logged this week</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.projects.map((project, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className={`h-3 w-3 ${project.color} rounded-full`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {project.name}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total Time
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {data.summary.totalTime}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  Across {data.summary.totalProjects} project
                  {data.summary.totalProjects !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
