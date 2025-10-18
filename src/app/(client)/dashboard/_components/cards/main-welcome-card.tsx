"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader, Play } from "lucide-react";

export function MainWelcomeCard() {
  const [isTracking, setIsTracking] = useState(false);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  return (
    <div>
      <Card className="bg-[#859FD5]/20">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex gap-6 ">
              <Avatar className="h-20 w-20 ring-primary ring-1 shadow-sm">
                <AvatarFallback className="text-2xl bg-secondary text-primary-foreground ">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-col gap-3">
                <div className="text-primary text-lg">Welcome</div>
                <div className="text-2xl font-semibold text-primary">
                  Jane Doe
                </div>
                <div className=" text-primary">
                  WPH (Malaysia) Sdn Bhd | Engineering Department | Software
                  Developer
                </div>
              </div>
            </div>
            <div>
              <Button
                onClick={toggleTracking}
                variant={isTracking ? "default" : "default"}
              >
                {isTracking ? (
                  <div className="flex gap-2 items-center w-28 justify-center">
                    <Play />
                    <span>Start Tracking</span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center w-28 justify-center">
                    <Loader className="animate-spin" />
                    <span className="animate-pulse">Tracking ...</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
