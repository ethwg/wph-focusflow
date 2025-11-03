"use client";

import { useOnboarding } from "@/context/onboarding/onboarding-context";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import Image from "next/image";

interface Tool {
  tool_id: number;
  name: string;
  category: string;
  integration_type: string;
}

// Map tool names to their icon paths
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
};

export function ToolsStep() {
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    onboardingData.tools || [],
  );

  useEffect(() => {
    // Fetch available tools based on selected role
    const fetchTools = async () => {
      if (!onboardingData.position) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/onboarding/tools?roleId=${onboardingData.position}`,
        );
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools || []);
        }
      } catch (error) {
        console.error("Error fetching tools:", error);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [onboardingData.position]);

  const handleToolToggle = (toolId: string) => {
    setSelectedTools((prev) => {
      const newSelection = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];

      return newSelection;
    });
  };

  // Update context when selectedTools changes
  useEffect(() => {
    updateOnboardingData({ tools: selectedTools });
  }, [selectedTools]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          What tools do you want to log?
        </h2>

        {!onboardingData.position ? (
          // No position selected
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Please select a position first to see available tools.
            </p>
          </div>
        ) : (
          <>
            {/* Tools Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 rounded-full border bg-muted/50 animate-pulse"
                  />
                ))
              ) : tools.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full">
                  No tools available for your selected position.
                </p>
              ) : (
                tools.map((tool) => {
                  const isSelected = selectedTools.includes(
                    tool.tool_id.toString(),
                  );
                  const iconPath =
                    toolIcons[tool.name] || "/assets/icons/default-tool.svg";

                  return (
                    <Button
                      key={tool.tool_id}
                      variant="outline"
                      className={`h-16 px-4 rounded-full flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary hover:bg-primary/20"
                          : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                      onClick={() => handleToolToggle(tool.tool_id.toString())}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Tool Icon */}
                        <div className="relative w-6 h-6 flex-shrink-0">
                          <Image
                            src={iconPath}
                            alt={tool.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>

                        {/* Tool Name */}
                        <span className="text-sm font-medium truncate">
                          {tool.name}
                        </span>
                      </div>

                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </Button>
                  );
                })
              )}
            </div>

            {/* Helper Text */}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Give us your consent on what to log.
            </p>

            {/* Selected Count */}
          </>
        )}
      </div>
    </div>
  );
}
