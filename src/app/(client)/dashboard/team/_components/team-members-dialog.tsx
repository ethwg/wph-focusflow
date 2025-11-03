"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users,
  Bell,
  Loader2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  user_id: number;
  name: string;
  email: string;
  role: {
    name: string;
  } | null;
  last_report_date: string | null;
}

interface TeamData {
  teamName: string;
  isManager: boolean;
  inviteCode?: string;
  members: TeamMember[];
}

type SortField = "name" | "email" | "role" | "last_report";
type SortOrder = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function TeamMembersDialog() {
  const [open, setOpen] = useState(false);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (open && !teamData) {
      fetchTeamMembers();
    }
  }, [open]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, sortField, sortOrder]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/team-members");
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      setTeamData(data);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const sendDailyReportReminder = async (userId: number, userName: string) => {
    setSendingReminder(userId);
    try {
      const res = await fetch("/api/dashboard/team/daily-report-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          type: "daily_report_reminder",
          message:
            "Your manager sent you a reminder to submit your daily report.",
          data: {
            reminderType: "daily_report",
            sentAt: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to send reminder");

      toast.success(`Reminder sent to ${userName}`);
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error(`Failed to send reminder to ${userName}`);
    } finally {
      setSendingReminder(null);
    }
  };

  const sendReminderToAll = async () => {
    if (!teamData?.members) return;

    setSendingReminder(-1);
    try {
      // Send individual notifications to each member
      const promises = teamData.members.map((member) =>
        fetch("/api/dashboard/team/daily-report-reminder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: member.user_id,
            type: "daily_report_reminder",
            message:
              "Your manager sent you a reminder to submit your daily report.",
            data: {
              reminderType: "daily_report",
              sentAt: new Date().toISOString(),
              bulkSend: true,
            },
          }),
        }),
      );

      await Promise.all(promises);
      toast.success(`Reminders sent to all team members`);
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send reminders to all members");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const formatLastReport = (dateString: string | null) => {
    if (!dateString)
      return <span className="text-muted-foreground">Never</span>;

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffInDays === 0) {
        return <span className="text-green-600 font-medium">Today</span>;
      } else if (diffInDays === 1) {
        return <span className="text-yellow-600">Yesterday</span>;
      } else if (diffInDays <= 7) {
        return <span className="text-orange-600">{diffInDays} days ago</span>;
      } else {
        return (
          <span className="text-red-600">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      }
    } catch (error) {
      console.error(error);
      return <span className="text-muted-foreground">Unknown</span>;
    }
  };

  // Get unique roles for filter
  const uniqueRoles = Array.from(
    new Set(
      teamData?.members
        .map((m) => m.role?.name)
        .filter((r): r is string => r !== null && r !== undefined),
    ),
  ).sort();

  // Filter and sort members
  const filteredAndSortedMembers = teamData?.members
    ? teamData.members
        .filter((member) => {
          // Search filter
          const matchesSearch =
            searchQuery === "" ||
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());

          // Role filter
          const matchesRole =
            roleFilter === "all" || member.role?.name === roleFilter;

          return matchesSearch && matchesRole;
        })
        .sort((a, b) => {
          let compareValue = 0;

          switch (sortField) {
            case "name":
              compareValue = a.name.localeCompare(b.name);
              break;
            case "email":
              compareValue = a.email.localeCompare(b.email);
              break;
            case "role":
              compareValue = (a.role?.name || "").localeCompare(
                b.role?.name || "",
              );
              break;
            case "last_report":
              const aDate = a.last_report_date
                ? new Date(a.last_report_date).getTime()
                : 0;
              const bDate = b.last_report_date
                ? new Date(b.last_report_date).getTime()
                : 0;
              compareValue = aDate - bDate;
              break;
          }

          return sortOrder === "asc" ? compareValue : -compareValue;
        })
    : [];

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedMembers.length / ITEMS_PER_PAGE,
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMembers = filteredAndSortedMembers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Users /> Team Members
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teamData?.teamName || "Team"} Members</DialogTitle>
          <DialogDescription>
            {teamData?.isManager
              ? "View and manage your team members. Send daily report reminders to keep everyone on track."
              : "View your team members."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : teamData ? (
          <div className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teamData.isManager && filteredAndSortedMembers.length > 1 && (
                <Button
                  onClick={sendReminderToAll}
                  disabled={sendingReminder !== null}
                  size="default"
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  {sendingReminder === -1 ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      Remind All
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredAndSortedMembers.length)} of{" "}
              {filteredAndSortedMembers.length} member(s)
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Name
                        {getSortIcon("name")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("email")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Email
                        {getSortIcon("email")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("role")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Role
                        {getSortIcon("role")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("last_report")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Last Report
                        {getSortIcon("last_report")}
                      </button>
                    </TableHead>
                    {teamData.isManager && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={teamData.isManager ? 5 : 4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchQuery || roleFilter !== "all"
                          ? "No members match your filters"
                          : "No team members found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMembers.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell className="font-medium">
                          {member.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                            {member.role?.name || "No Role"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatLastReport(member.last_report_date)}
                        </TableCell>
                        {teamData.isManager && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                sendDailyReportReminder(
                                  member.user_id,
                                  member.name,
                                )
                              }
                              disabled={sendingReminder !== null}
                            >
                              {sendingReminder === member.user_id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4" />
                                  Send Reminder
                                </>
                              )}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <div key={page} className="flex gap-1">
                            {showEllipsis && (
                              <span className="px-2 py-1 text-muted-foreground">
                                ...
                              </span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Team Invite Code */}
            {teamData.isManager && teamData.inviteCode && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Team Invite Code</p>
                <code className="text-sm bg-background px-3 py-1.5 rounded border">
                  {teamData.inviteCode}
                </code>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load team members
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
