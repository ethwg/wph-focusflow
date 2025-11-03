"use client";

import { BadgeCheck, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const menuItems = [
    {
      group: "account",
      items: [
        {
          icon: BadgeCheck,
          label: "Account",
          onClick: () => {},
          link: "/user",
        },
      ],
    },
    {
      group: "logout",
      items: [
        {
          icon: LogOut,
          label: "Log out",
          onClick: () => setIsLogoutDialogOpen(true),
          link: "#",
        },
      ],
    },
  ];

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full hover:bg-[#F5F8FB] transition-colors cursor-pointer"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="h-10 w-10 border-2 border-[#E8EEF5]">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-secondary text-primary-foreground">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </Button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          {isOpen && (
            <DropdownMenuContent
              className="w-64 p-2"
              align="end"
              sideOffset={8}
              asChild
              forceMount
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-3 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="h-12 w-12 border-2 border-[#E8EEF5]">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-secondary text-primary-foreground">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-semibold  text-[#2D3748]">
                        {user.name}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                {menuItems.map((group, groupIndex) => (
                  <div key={group.group}>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuGroup>
                      {group.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: groupIndex * 0.05 + itemIndex * 0.03,
                            duration: 0.2,
                          }}
                        >
                          <Link href={item.link}>
                            <DropdownMenuItem
                              onClick={item.onClick}
                              className="cursor-pointer rounded-md hover:bg-[#F5F8FB] transition-colors py-2.5"
                            >
                              <item.icon className="mr-3 h-4 w-4 text-[#8B99AC]" />
                              <span className="text-sm text-[#2D3748]">
                                {item.label}
                              </span>
                            </DropdownMenuItem>
                          </Link>
                        </motion.div>
                      ))}
                    </DropdownMenuGroup>
                  </div>
                ))}
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>

      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account and redirected to the home
              page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
