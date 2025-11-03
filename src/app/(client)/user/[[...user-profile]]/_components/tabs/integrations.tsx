"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Settings } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import Image from "next/image";
import { ConfigureToolDialog } from "./integration-configure-dialog";

interface Tool {
  tool_id: number;
  name: string;
  category: string;
  integration_type: string;
}

interface ToolConnection {
  access_token?: string;
  refresh_token?: string;
  connected_at?: string;
  config?: Record<string, unknown>;
  oauth_data?: Record<string, unknown>;
  expires_at?: string;
}

type ToolConnections = Record<string, ToolConnection>;

interface ToolsData {
  tools: Tool[];
  roleName: string;
  toolPermissions?: Record<string, boolean>; // legacy
  toolPermissionsById?: Record<string, boolean>; // preferred
  toolConnections?: ToolConnections; // ✅ used to show "Configured"
}

interface ErrorResponse {
  error?: string;
}

const toolIcons: Record<string, string> = {
  GitHub: "/assets/icons/github.svg",
  Figma: "/assets/icons/figma.svg",
  Trello: "/assets/icons/trello.svg",
  Slack: "/assets/icons/slack.svg",
  WhatsApp: "/assets/icons/whatsapp.svg",
  Zoom: "/assets/icons/zoom.svg",
  FB: "/assets/icons/facebook.svg",
  IG: "/assets/icons/instagram.svg",
  TikTok: "/assets/icons/tiktok.svg",
  Jira: "/assets/icons/jira.svg",
  Notion: "/assets/icons/notion.svg",
  Calendar: "/assets/icons/calendar.svg",
  Sheets: "/assets/icons/sheets.svg",
};

const toolDescriptions: Record<string, string[]> = {
  GitHub: [
    "Repository contributions",
    "Merge requests and reviews",
    "CI/CD activity",
  ],
  Jira: ["Issue assignments", "Issue creation/closure", "Sprint participation"],
  Notion: [
    "Documentation contributions",
    "Knowledge base activity",
    "Task status changes",
  ],
  Calendar: ["Meeting attendance", "Meeting durations", "Meeting context"],
  Sheets: ["Data contributions", "Automation triggers"],
  Slack: [
    "Communication frequency",
    "Thread participation",
    "Channel knowledge sharing",
  ],
  Figma: ["Design contributions", "Collaboration activity", "File updates"],
  Trello: ["Card updates", "Board activity", "Task completions"],
  WhatsApp: ["Team communication", "Message frequency"],
  Zoom: ["Meeting attendance", "Call durations"],
  FB: ["Post engagement", "Community interaction"],
  IG: ["Content creation", "Engagement metrics"],
  TikTok: ["Video uploads", "Engagement tracking"],
};

export function Integrations() {
  const { profile, updateProfile } = useUserProfile();
  const [toolsData, setToolsData] = useState<ToolsData | null>(null);
  const [permissionsById, setPermissionsById] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  // --- fetcher used on mount and after OAuth success ---
  const loadTools = async () => {
    const resp = await fetch("/api/user/role-tools");
    if (!resp.ok) {
      const err = (await resp.json().catch(() => ({}))) as ErrorResponse;
      throw new Error(err.error || "Failed to fetch tools");
    }
    const data = (await resp.json()) as ToolsData;
    setToolsData(data);

    if (data.toolPermissionsById) {
      setPermissionsById(data.toolPermissionsById);
    } else {
      // map legacy name-keyed -> id-keyed for backward compat
      const byName = data.toolPermissions ?? {};
      const map: Record<string, boolean> = {};
      for (const t of data.tools) {
        map[String(t.tool_id)] = byName[t.name];
      }
      setPermissionsById(map);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadTools();
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connections = toolsData?.toolConnections ?? {};
  const isToolConfigured = (toolId: number) =>
    Object.prototype.hasOwnProperty.call(connections, String(toolId));

  const handleToggle = (toolId: number, enabled: boolean) => {
    setPermissionsById((prev) => ({ ...prev, [String(toolId)]: enabled }));
    setHasChanges(true);
  };

  const handleConfigure = (toolId: number) => {
    const tool = toolsData?.tools.find((t) => t.tool_id === toolId) || null;
    if (!tool) return;
    setSelectedTool(tool);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // keep a legacy mirror by name for old clients (optional)
      const legacyByName: Record<string, boolean> = {};
      for (const t of toolsData?.tools ?? []) {
        const id = String(t.tool_id);
        if (id in permissionsById) legacyByName[t.name] = permissionsById[id];
      }

      const newPrivacy = {
        ...(profile?.privacy_settings ?? {}),
        tool_permissions_by_id: permissionsById, // canonical
        tool_permissions: legacyByName, // legacy mirror (optional)
      };
      const ok = await updateProfile({ privacy_settings: newPrivacy });
      if (ok) {
        toast.success("Integration permissions updated");
        setHasChanges(false);
        await loadTools(); // refresh connections/permissions
      } else {
        toast.error("Failed to update integration permissions");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while updating");
    } finally {
      setIsSaving(false);
    }
  };

  const headerRole = useMemo(() => toolsData?.roleName ?? "your", [toolsData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
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

  if (!toolsData || toolsData.tools.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No integrations available for your role. Contact your administrator
            to configure tools for your role.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Permission Configurations
          </h3>
          <p className="text-sm text-gray-600">
            Control which integrations can track your activities. These tools
            are configured for the{" "}
            <span className="font-medium">{headerRole}</span> role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {toolsData.tools.map((tool) => {
            const configured = isToolConfigured(tool.tool_id);
            const enabled = permissionsById[String(tool.tool_id)] ?? configured; // default enabled if configured
            const icon = toolIcons[tool.name];
            const descriptions = toolDescriptions[tool.name] ?? [
              "Activity tracking",
              "Usage monitoring",
            ];

            return (
              <div
                key={tool.tool_id}
                className={`border rounded-lg p-4 transition-colors ${
                  configured
                    ? "border-gray-200 hover:border-gray-300"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {icon ? (
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center p-2 ${
                          configured ? "bg-gray-50" : "bg-gray-100"
                        }`}
                      >
                        <Image
                          src={icon}
                          alt={tool.name}
                          width={24}
                          height={24}
                          className={`object-contain ${!configured ? "opacity-40" : ""}`}
                        />
                      </div>
                    ) : (
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          configured ? "bg-primary/10" : "bg-gray-100"
                        }`}
                      >
                        <span
                          className={`font-semibold text-sm ${configured ? "text-primary" : "text-gray-400"}`}
                        >
                          {tool.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4
                        className={`font-semibold ${configured ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {tool.name}
                      </h4>
                      {!configured && (
                        <span className="text-xs text-amber-600 font-medium">
                          Not Configured
                        </span>
                      )}
                    </div>
                  </div>

                  {configured ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          handleToggle(tool.tool_id, checked)
                        }
                      />
                      {tool.name === "Figma" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-xs h-8 px-2"
                          onClick={() => handleConfigure(tool.tool_id)}
                        >
                          <Settings />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 cursor-pointer"
                      onClick={() => handleConfigure(tool.tool_id)}
                    >
                      Configure
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <p
                    className={`text-xs font-medium mb-2 ${configured ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Actions Detected:
                  </p>
                  <ul className="space-y-1">
                    {descriptions.map((d, idx) => (
                      <li
                        key={idx}
                        className={`text-xs flex items-start ${configured ? "text-gray-600" : "text-gray-400"}`}
                      >
                        <span className="mr-2">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {selectedTool && (
        <ConfigureToolDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedTool(null);
          }}
          tool={{
            tool_id: selectedTool.tool_id,
            name: selectedTool.name,
            integration_type: selectedTool.integration_type,
          }}
          existingConnection={connections[String(selectedTool.tool_id)]}
          onSuccess={async () => {
            // Reload server state so "Not Configured" flips
            await loadTools();
            // Optional optimistic permission enable:
            setPermissionsById((prev) => ({
              ...prev,
              [String(selectedTool.tool_id)]: true,
            }));
            setHasChanges(true);
            toast.success(`${selectedTool.name} connected`);
          }}
        />
      )}
    </>
  );
}
