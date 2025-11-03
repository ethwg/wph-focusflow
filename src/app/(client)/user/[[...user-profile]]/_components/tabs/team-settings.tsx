"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamMember {
  user_id: number;
  name: string;
  email: string;
  role: {
    name: string;
  } | null;
}

interface TeamData {
  teamName: string;
  isManager: boolean;
  inviteCode?: string;
  members: TeamMember[];
}

export function TeamSettings() {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const response = await fetch("/api/user/team-members");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch team members");
        }

        const data = await response.json();
        setTeamData(data);
      } catch (err) {
        console.error("Error fetching team members:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeamMembers();
  }, []);

  // Copy invite code to clipboard
  const copyInviteCode = async () => {
    if (teamData?.inviteCode) {
      await navigator.clipboard.writeText(teamData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-2 mt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!teamData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {teamData.teamName}
            </h3>
            <p className="text-sm text-gray-600">
              {teamData.isManager
                ? `Managing ${teamData.members.length} team member${teamData.members.length !== 1 ? "s" : ""}`
                : "Your team information"}
            </p>
          </div>
        </div>

        {/* Invite Code Section - Only for Managers */}
        {teamData.isManager && teamData.inviteCode && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Team Invite Code
                </p>
                <code className="text-sm font-mono bg-white px-3 py-1.5 rounded border border-blue-200 text-blue-700">
                  {teamData.inviteCode}
                </code>
              </div>
              <Button
                onClick={copyInviteCode}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Share this code with new team members to join your team
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">
                User
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Email
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Team
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-gray-500"
                >
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              teamData.members.map((member) => (
                <TableRow
                  key={member.user_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* User Column */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          <span className="text-xs">
                            {getInitials(member.name)}
                          </span>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {member.name}
                        </span>
                        {member.role?.name === "Admin" && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Email Column */}
                  <TableCell>
                    <span className="text-gray-600">{member.email}</span>
                  </TableCell>

                  {/* Team Column */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {teamData.teamName}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer info for non-managers */}
      {!teamData.isManager && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> Only team managers can
            view the full team list. You are viewing your own information.
          </p>
        </div>
      )}
    </div>
  );
}
