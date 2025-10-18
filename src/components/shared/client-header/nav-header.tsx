// nav-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NavUser } from "@/components/shared/client-header/nav-user";

const data = {
  user: {
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "/avatars/jane.jpg",
  },
};

const navItems = [
  { label: "Personal Dashboard", href: "/dashboard" },
  { label: "Team Dashboard", href: "/team" },
  { label: "Actions Log", href: "/actions" },
];

export function NavHeader() {
  const pathname = usePathname();

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
              <span className="text-primary text-xl font-semibold  tracking-tight">
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
        {/* Right Section: Tracking Toggle + User Menu */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <NavUser user={data.user} />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
