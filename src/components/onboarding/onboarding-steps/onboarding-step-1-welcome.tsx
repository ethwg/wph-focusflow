"use client";

import { Users, Zap, Target } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">Welcome Aboard! 🎉</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We&#39;re excited to have you here. Let&#39;s take a few moments to
          set up your profile and get you connected with your team.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
        <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold mb-1">Join Your Team</h3>
          <p className="text-sm text-muted-foreground">
            Connect with your organization and teammates
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold mb-1">Set Up Tools</h3>
          <p className="text-sm text-muted-foreground">
            Choose the tools you&#39;ll be working with
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
            <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold mb-1">Define Your Role</h3>
          <p className="text-sm text-muted-foreground">
            Tell us about your position and department
          </p>
        </div>
      </div>

      {/* What to Expect */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-sm">What to expect:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Quick setup that takes less than 2 minutes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Personalized experience based on your role</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Easy connection with your team and organization</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
