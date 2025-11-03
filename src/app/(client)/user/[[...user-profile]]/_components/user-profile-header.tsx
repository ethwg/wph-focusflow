"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Mail, Calendar } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export function ProfileHeaderBanner() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  const isLoading = !isClerkLoaded || isProfileLoading;

  if (isLoading) {
    return (
      <div className="w-full rounded-lg shadow-sm overflow-hidden">
        <Skeleton className="h-32 w-full" />

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
            <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />

            <div className="flex-1 md:mb-2 space-y-3">
              <Skeleton className="h-8 w-48 mt-18" />
              <Skeleton className="h-5 w-32" />
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            <div className="md:mb-2">
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return null;
  }

  const fullName =
    profile?.name ||
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
  const userEmail =
    profile?.email || clerkUser.emailAddresses[0]?.emailAddress || "";
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : clerkUser.createdAt
      ? new Date(clerkUser.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full rounded-lg shadow-sm overflow-hidden relative"
    >
      <div className="h-32 bg-primary/40">
        <div className="absolute inset-0" />
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
          {/* Avatar with Upload Button */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-2 ring-gray-100">
              <AvatarImage src={clerkUser.imageUrl} alt={fullName} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {clerkUser.firstName?.[0]}
                {clerkUser.lastName?.[0]}
              </AvatarFallback>
            </Avatar>

            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-1 right-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 md:mb-2"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-1 mt-18">
              {fullName || "User"}
            </h1>

            <p className="text-base text-gray-600 mb-3">
              @{clerkUser.username || "username"}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <span>{userEmail}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
