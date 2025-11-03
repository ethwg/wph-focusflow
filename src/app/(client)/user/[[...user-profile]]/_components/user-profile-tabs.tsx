"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Settings, Users, Puzzle } from "lucide-react";
import { ProfileHeaderBanner } from "./user-profile-header";
import { AccountSettings } from "@/app/(client)/user/[[...user-profile]]/_components/tabs/account-settings";
import { TeamSettings } from "@/app/(client)/user/[[...user-profile]]/_components/tabs/team-settings";
import { Integrations } from "@/app/(client)/user/[[...user-profile]]/_components/tabs/integrations";

// import Integrations from "./Integrations";

const tabs = [
  {
    name: "Account Settings",
    value: "account",
    icon: Settings,
  },
  {
    name: "Team Settings",
    value: "team",
    icon: Users,
  },
  {
    name: "Integrations",
    value: "integrations",
    icon: Puzzle,
  },
];

export function ProfileTabs() {
  return (
    <div className="w-full space-y-6">
      {/* Profile Header */}
      <ProfileHeaderBanner />

      {/* Tabs Container */}
      <Tabs
        orientation="vertical"
        defaultValue={tabs[0].value}
        className="w-full flex flex-row items-start gap-6"
      >
        <TabsList className="shrink-0 grid grid-cols-1 min-w-56 p-0 bg-background ">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="border-l-2 border-transparent justify-start rounded-none hover:border-l-2 hover:border-l-primary data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/5 py-3 hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <tab.icon className="h-5 w-5 me-2" /> {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 w-full">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tab.value === "account" && <AccountSettings />}

                {tab.value === "team" && <TeamSettings />}

                {tab.value === "integrations" && <Integrations />}
              </motion.div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
