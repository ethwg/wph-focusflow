"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import Image from "next/image";

interface ConfigureToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: {
    tool_id: number;
    name: string;
    integration_type: string;
  };
  onSuccess: () => void;
  existingConnection?: {
    config?: {
      file_keys?: string[];
    };
  };
}

type ConnectionStep =
  | "initial"
  | "connecting"
  | "configuring"
  | "success"
  | "error";

type ToolConfig = {
  icon: string | null;
  description: string;
  permissions: string[];
  authType: "oauth" | "manual";
  requiresConfig?: boolean;
};

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  GitHub: {
    icon: "/assets/icons/github.svg",
    description:
      "Track repository contributions, pull requests, and code reviews.",
    permissions: [
      "Read repository information",
      "Access commit history",
      "View pull requests and reviews",
    ],
    authType: "oauth",
  },
  Figma: {
    icon: "/assets/icons/figma.svg",
    description: "Track design file activity and collaboration.",
    permissions: [
      "Read file content and metadata",
      "View file comments",
      "Access project information",
    ],
    authType: "oauth",
    requiresConfig: true,
  },
  Slack: {
    icon: "/assets/icons/slack.svg",
    description: "Monitor team communication and collaboration patterns.",
    permissions: [
      "Read channel messages",
      "Access user presence",
      "View workspace information",
    ],
    authType: "oauth",
  },
  Jira: {
    icon: "/assets/icons/jira.svg",
    description: "Track issue management and sprint participation.",
    permissions: [
      "Read issues and projects",
      "View sprint information",
      "Access user assignments",
    ],
    authType: "oauth",
  },
  Calendar: {
    icon: "/assets/icons/calendar.svg",
    description: "Track meeting attendance and time allocation.",
    permissions: [
      "Read calendar events",
      "View event details",
      "Access meeting attendees",
    ],
    authType: "oauth",
  },
  Notion: {
    icon: "/assets/icons/notion.svg",
    description: "Track documentation contributions.",
    permissions: [
      "Read pages and databases",
      "View page edits",
      "Access workspace information",
    ],
    authType: "oauth",
  },
  Sheets: {
    icon: "/assets/icons/sheets.svg",
    description: "Track data contributions and automation triggers.",
    permissions: [
      "Read spreadsheet data",
      "View edit history",
      "Access file metadata",
    ],
    authType: "oauth",
  },
  Trello: {
    icon: "/assets/icons/trello.svg",
    description: "Track card creation, comments, moves and board activity.",
    permissions: ["Read boards", "Read cards and actions", "Read comments"],
    authType: "manual",
  },
  WhatsApp: {
    icon: "/assets/icons/whatsapp.svg",
    description: "Track messaging activity.",
    permissions: ["Read messages", "Access contact information"],
    authType: "oauth",
  },
  Zoom: {
    icon: "/assets/icons/zoom.svg",
    description: "Track meeting participation.",
    permissions: ["Read meeting information", "View attendee data"],
    authType: "oauth",
  },
  FB: {
    icon: "/assets/icons/facebook.svg",
    description: "Track Facebook activity.",
    permissions: ["Read posts", "Access profile information"],
    authType: "oauth",
  },
  IG: {
    icon: "/assets/icons/instagram.svg",
    description: "Track Instagram activity.",
    permissions: ["Read posts", "Access profile information"],
    authType: "oauth",
  },
  TikTok: {
    icon: "/assets/icons/tiktok.svg",
    description: "Track TikTok activity.",
    permissions: ["Read videos", "Access profile information"],
    authType: "oauth",
  },
};

export function ConfigureToolDialog({
  open,
  onOpenChange,
  tool,
  onSuccess,
  existingConnection,
}: ConfigureToolDialogProps) {
  const config = TOOL_CONFIGS[tool.name] || {
    icon: null,
    description: `Connect your ${tool.name} account to enable activity tracking.`,
    permissions: ["Access basic information", "Read activity data"],
    authType: "oauth" as const,
  };

  const isAlreadyConnected = !!existingConnection;
  const isReconfiguring = isAlreadyConnected && config.requiresConfig;

  const [step, setStep] = useState<ConnectionStep>(
    isReconfiguring ? "configuring" : "initial",
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Trello credentials
  const [trelloApiKey, setTrelloApiKey] = useState("");
  const [trelloToken, setTrelloToken] = useState("");

  // Figma file keys - initialize with existing keys if reconfiguring
  const [figmaFileKeys, setFigmaFileKeys] = useState<string[]>(
    existingConnection?.config?.file_keys?.length
      ? existingConnection.config.file_keys
      : [""],
  );

  const resetState = () => {
    setStep(isReconfiguring ? "configuring" : "initial");
    setError(null);
    setIsProcessing(false);
    if (!isReconfiguring) {
      setTrelloApiKey("");
      setTrelloToken("");
      setFigmaFileKeys([""]);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setTimeout(resetState, 300);
    }
  };

  // ==================== OAuth Flow ====================
  const initiateOAuth = async () => {
    setIsProcessing(true);
    setError(null);
    setStep("connecting");

    try {
      const response = await fetch(
        `/api/oauth/${tool.name.toLowerCase()}/authorize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool_id: tool.tool_id }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initiate authorization");
      }

      const { authUrl, state } = await response.json();

      const popup = openOAuthPopup(authUrl);
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }

      await listenForOAuthResult(popup, state);

      if (config.requiresConfig && tool.name === "Figma") {
        setStep("configuring");
        setIsProcessing(false);
      } else {
        setStep("success");
        finishSuccessfully();
      }
    } catch (e) {
      console.error("OAuth error:", e);
      setError(e instanceof Error ? e.message : "Connection failed");
      setStep("error");
      setIsProcessing(false);
    }
  };

  const openOAuthPopup = (authUrl: string): Window | null => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    return window.open(
      authUrl,
      "OAuth Authorization",
      `width=${width},height=${height},left=${left},top=${top}`,
    );
  };

  const listenForOAuthResult = (
    popup: Window,
    expectedState: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (
          event.data.type === "oauth-success" &&
          event.data.state === expectedState
        ) {
          cleanup();
          popup.close();

          const verified = await verifyConnection();
          if (verified) {
            resolve();
          } else {
            reject(new Error("Failed to verify connection"));
          }
        } else if (event.data.type === "oauth-error") {
          cleanup();
          popup.close();
          reject(new Error(event.data.error || "Authorization failed"));
        }
      };

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error("Authorization was cancelled"));
        }
      }, 500);

      const cleanup = () => {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
      };

      window.addEventListener("message", handleMessage);
    });
  };

  const verifyConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/user/profile");
      return response.ok;
    } catch {
      return false;
    }
  };

  // ==================== Trello Manual Auth ====================
  const handleTrelloConnect = async () => {
    if (!trelloApiKey.trim() || !trelloToken.trim()) {
      setError("Please provide both API Key and Token");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep("connecting");

    try {
      const response = await fetch("/api/user/integrations/trello/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_id: tool.tool_id,
          api_key: trelloApiKey.trim(),
          token: trelloToken.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save credentials");
      }

      setStep("success");
      finishSuccessfully();
    } catch (e) {
      console.error("Trello connection error:", e);
      setError(e instanceof Error ? e.message : "Connection failed");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== Figma File Keys ====================
  const addFileKey = () => {
    setFigmaFileKeys([...figmaFileKeys, ""]);
  };

  const removeFileKey = (index: number) => {
    if (figmaFileKeys.length > 1) {
      setFigmaFileKeys(figmaFileKeys.filter((_, i) => i !== index));
    }
  };

  const updateFileKey = (index: number, value: string) => {
    const updated = [...figmaFileKeys];
    updated[index] = value;
    setFigmaFileKeys(updated);
  };

  const handleSaveFigmaConfig = async () => {
    const validKeys = figmaFileKeys
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (validKeys.length === 0) {
      setError("Please add at least one Figma file key");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/user/integrations/figma/save-file-keys",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool_id: tool.tool_id,
            file_keys: validKeys,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save file keys");
      }

      setStep("success");
      finishSuccessfully();
    } catch (e) {
      console.error("Figma config error:", e);
      setError(e instanceof Error ? e.message : "Failed to save configuration");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== Completion ====================
  const finishSuccessfully = () => {
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
      setTimeout(resetState, 300);
    }, 1200);
  };

  // ==================== Render Helpers ====================
  const renderIcon = () => {
    if (config.icon) {
      return (
        <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center p-2">
          <Image
            src={config.icon}
            alt={tool.name}
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
      );
    }

    return (
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="text-primary font-semibold text-lg">
          {tool.name.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  const renderTitle = () => {
    if (step === "configuring") {
      return isReconfiguring
        ? `Manage ${tool.name} Files`
        : `Configure ${tool.name}`;
    }
    if (step === "success") return "Connected!";
    return `Connect ${tool.name}`;
  };

  const renderDescription = () => {
    if (step === "configuring") {
      return isReconfiguring ? "Update file keys" : "Complete setup";
    }
    if (step === "success") return "Integration active";
    return "Authorize integration";
  };

  const renderInitialStep = () => (
    <>
      <p className="text-sm text-gray-600">{config.description}</p>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          This integration will access:
        </p>
        <ul className="space-y-2">
          {config.permissions.map((permission, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-gray-600"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{permission}</span>
            </li>
          ))}
        </ul>
      </div>

      {config.authType === "manual" && tool.name === "Trello" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Get your credentials at{" "}
              <a
                href="https://trello.com/app-key"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                trello.com/app-key
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trello-key">API Key</Label>
            <Input
              id="trello-key"
              placeholder="Enter your Trello API Key"
              value={trelloApiKey}
              onChange={(e) => setTrelloApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trello-token">Token</Label>
            <Input
              id="trello-token"
              placeholder="Enter your Trello Token"
              value={trelloToken}
              onChange={(e) => setTrelloToken(e.target.value)}
            />
          </div>
        </div>
      )}

      {config.authType === "oauth" && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            You&apos;ll be redirected to {tool.name}&apos;s authorization page.
            Your credentials are never shared with Focus Flow.
          </p>
        </div>
      )}
    </>
  );

  const renderConfiguringStep = () => {
    if (tool.name !== "Figma") return null;

    return (
      <>
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 ">
            <p className="mb-1">
              {isReconfiguring
                ? "Update the Figma files you want to track."
                : "Add Figma file keys to track activity."}
            </p>
            <p>
              Find file keys in your Figma URL:{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded font-mono mt-2">
                figma.com/design/[FILE_KEY]/...
              </code>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label>File Keys (minimum 1 required)</Label>
          {figmaFileKeys.map((key, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="e.g., abc123XYZ789def456"
                value={key}
                onChange={(e) => updateFileKey(index, e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              {figmaFileKeys.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeFileKey(index)}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addFileKey}
            disabled={isProcessing}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another File Key
          </Button>
        </div>
      </>
    );
  };

  const renderSuccessStep = () => (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        {isReconfiguring
          ? `Successfully updated ${tool.name} configuration!`
          : `Successfully connected to ${tool.name}!`}{" "}
        {!isReconfiguring && "Redirecting..."}
      </AlertDescription>
    </Alert>
  );

  const renderContent = () => {
    if (step === "success") return renderSuccessStep();
    if (step === "configuring") return renderConfiguringStep();
    return renderInitialStep();
  };

  const renderActionButton = () => {
    if (step === "success") {
      return (
        <Button disabled className="w-full sm:w-auto">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isReconfiguring ? "Updated" : "Connected"}
        </Button>
      );
    }

    if (step === "configuring" && tool.name === "Figma") {
      const validKeys = figmaFileKeys.filter((k) => k.trim().length > 0);
      return (
        <Button
          onClick={handleSaveFigmaConfig}
          disabled={isProcessing || validKeys.length === 0}
          className="w-full sm:w-auto"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isReconfiguring ? "Update Files" : "Complete Setup"}
        </Button>
      );
    }

    if (config.authType === "manual" && tool.name === "Trello") {
      return (
        <Button
          onClick={handleTrelloConnect}
          disabled={isProcessing || !trelloApiKey.trim() || !trelloToken.trim()}
          className="w-full sm:w-auto"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Connect Trello
        </Button>
      );
    }

    return (
      <Button
        onClick={initiateOAuth}
        disabled={isProcessing}
        className="w-full sm:w-auto"
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isProcessing ? (
          "Connecting..."
        ) : (
          <>
            <ExternalLink className="mr-2 h-4 w-4" />
            Authorize {tool.name}
          </>
        )}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {renderIcon()}
            <div>
              <DialogTitle>{renderTitle()}</DialogTitle>
              <DialogDescription className="text-xs mt-2">
                {renderDescription()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {renderContent()}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing || step === "success"}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          {renderActionButton()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
