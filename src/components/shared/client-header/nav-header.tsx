"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NavUser } from "@/components/shared/client-header/nav-user";
import { Notifications } from "./nav-notification";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsManager } from "@/hooks/use-is-manager";
import { Skeleton } from "@/components/ui/skeleton";

const baseNavItems = [
  { label: "Personal Dashboard", href: "/dashboard" },
  { label: "Actions Log", href: "/dashboard/actions-log" },
];

const managerNavItem = { label: "Team Dashboard", href: "/dashboard/team" };

export function NavHeader() {
  const pathname = usePathname();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { isManager, isLoading: isManagerLoading } = useIsManager();

  const isLoading = !isClerkLoaded || isProfileLoading || isManagerLoading;

  // Build navigation items based on manager status
  const navItems = isManager
    ? [baseNavItems[0], managerNavItem, baseNavItems[1]]
    : baseNavItems;

  // Prepare user data for NavUser component
  const userData = clerkUser
    ? {
        name:
          profile?.name ||
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User",
        email:
          profile?.email || clerkUser.emailAddresses[0]?.emailAddress || "",
        avatar: clerkUser.imageUrl || "/avatars/default.jpg",
      }
    : null;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="flex h-20 items-center justify-between px-6">
        <div className="flex gap-12">
          {/* Logo Section */}
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

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    asChild
                    className={`relative ${isActive ? "" : ""}`}
                    size="lg"
                  >
                    <Link href={item.href}>
                      {item.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-[#E8EEF5] rounded-md -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Notifications & User Menu */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Notifications />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {isLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : userData ? (
              <NavUser user={userData} />
            ) : null}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
