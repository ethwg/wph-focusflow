"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";

interface PublishReportResponse {
  success?: boolean;
  timestamp?: string;
  error?: string;
}

export function PublishFocusReportButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleClick() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/reports/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({}), // no need to send userId from client
      });

      const data = (await res
        .json()
        .catch(() => ({}))) as PublishReportResponse;
      if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      const ts = data?.timestamp ?? new Date().toISOString();
      toast.success("Focus report published", {
        description: new Date(ts).toLocaleString(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to publish Focus Report", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button size="lg" onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Publishing..." : "Publish Focus Report"}
        <ArrowUp className="ml-2 h-4 w-4 rotate-45" />
      </Button>
    </div>
  );
}
