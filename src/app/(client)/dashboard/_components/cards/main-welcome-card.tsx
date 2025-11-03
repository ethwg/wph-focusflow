"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, Play, AlertCircle } from "lucide-react";

interface UserProfile {
  name: string;
  initials: string;
  organization: string | null;
  department: string | null;
  role: string | null;
  trackingEnabled: boolean;
}

export function MainWelcomeCard() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isClerkLoaded) {
      fetchProfile();
    }
  }, [isClerkLoaded]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/dashboard/personal/user-profile");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
      setIsTracking(data.trackingEnabled);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTracking = async () => {
    if (isUpdating) return;

    const newTrackingState = !isTracking;
    setIsUpdating(true);

    try {
      const response = await fetch("/api/dashboard/personal/user-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingEnabled: newTrackingState }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update tracking status");
      }

      setIsTracking(newTrackingState);
    } catch (err) {
      console.error("Error updating tracking status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update tracking",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isClerkLoaded || isLoading) {
    return (
      <Card className="bg-[#859FD5]/20">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-col gap-3 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#859FD5]/20">
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!profile || !clerkUser) {
    return null;
  }

  // Build the subtitle with available information
  const subtitleParts = [
    profile.organization,
    profile.department,
    profile.role,
  ].filter(Boolean);

  return (
    <div>
      <Card className="bg-[#859FD5]/20">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <Avatar className="h-20 w-20 ring-primary ring-1 shadow-sm">
                <AvatarImage src={clerkUser.imageUrl} alt={profile.name} />
                <AvatarFallback className="text-2xl bg-secondary text-primary-foreground">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-col gap-3">
                <div className="text-primary text-lg">Welcome</div>
                <div className="text-2xl font-semibold text-primary">
                  {profile.name}
                </div>
                <div className="text-primary">
                  {subtitleParts.length > 0
                    ? subtitleParts.join(" | ")
                    : "Complete your profile"}
                </div>
              </div>
            </div>
            <div>
              <Button
                onClick={toggleTracking}
                variant="default"
                disabled={isUpdating}
              >
                {isTracking ? (
                  <div className="flex gap-2 items-center w-36 justify-center">
                    <Loader className="animate-spin" />
                    <span className="animate-pulse">Tracking...</span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center w-36 justify-center">
                    <Play />
                    <span>Start Tracking</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
