"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
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
import { useUserProfile } from "@/hooks/useUserProfile";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import TimezoneSelect, { type ITimezone } from "react-timezone-select";
import type { EmailAddressResource } from "@clerk/types";
import { useClerk } from "@clerk/nextjs";

interface DayWorkingHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface WeeklyWorkingHours {
  monday: DayWorkingHours;
  tuesday: DayWorkingHours;
  wednesday: DayWorkingHours;
  thursday: DayWorkingHours;
  friday: DayWorkingHours;
  saturday: DayWorkingHours;
  sunday: DayWorkingHours;
}

interface PrivacySettings {
  working_hours?: WeeklyWorkingHours;
  [key: string]: unknown;
}

const defaultDayHours: DayWorkingHours = {
  enabled: true,
  start: "09:00",
  end: "17:00",
};

const defaultWeekendHours: DayWorkingHours = {
  enabled: false,
  start: "09:00",
  end: "17:00",
};

const defaultWeeklyHours: WeeklyWorkingHours = {
  monday: defaultDayHours,
  tuesday: defaultDayHours,
  wednesday: defaultDayHours,
  thursday: defaultDayHours,
  friday: defaultDayHours,
  saturday: defaultWeekendHours,
  sunday: defaultWeekendHours,
};

export function AccountSettings() {
  const { user: clerkUser, isLoaded } = useUser();
  const { profile, updateProfile, refetch } = useUserProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingClerk, setIsUpdatingClerk] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState<ITimezone>("");
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [workingHours, setWorkingHours] =
    useState<WeeklyWorkingHours>(defaultWeeklyHours);

  // Email verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [emailObj, setEmailObj] = useState<EmailAddressResource | undefined>();
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  // Password change alert dialog state
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const createEmailAddress = useReverification((email: string) =>
    clerkUser?.createEmailAddress({ email }),
  );

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    timezone: "",
    trackingEnabled: true,
    workingHours: defaultWeeklyHours,
  });

  // Initialize form values when profile loads
  useEffect(() => {
    if (profile) {
      const nameParts = profile.name.split(" ");
      const fName = nameParts[0] || "";
      const lName = nameParts.slice(1).join(" ") || "";
      const tz =
        profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const privacySettings = profile.privacy_settings as PrivacySettings;
      const wh = privacySettings?.working_hours || defaultWeeklyHours;

      setFirstName(fName);
      setLastName(lName);
      setEmail(profile.email);
      setSelectedTimezone(tz);
      setTrackingEnabled(profile.tracking_enabled);
      setWorkingHours(wh);

      // Store original values
      setOriginalValues({
        firstName: fName,
        lastName: lName,
        email: profile.email,
        timezone: tz,
        trackingEnabled: profile.tracking_enabled,
        workingHours: wh,
      });
    }
  }, [profile]);

  // Check if personal info has changed
  const hasPersonalInfoChanged = useMemo(() => {
    return (
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      email !== originalValues.email
    );
  }, [firstName, lastName, email, originalValues]);

  // Check if privacy settings have changed
  const hasPrivacySettingsChanged = useMemo(() => {
    const timezoneValue =
      typeof selectedTimezone === "string"
        ? selectedTimezone
        : selectedTimezone.value;

    return (
      timezoneValue !== originalValues.timezone ||
      trackingEnabled !== originalValues.trackingEnabled ||
      JSON.stringify(workingHours) !==
        JSON.stringify(originalValues.workingHours)
    );
  }, [selectedTimezone, trackingEnabled, workingHours, originalValues]);

  const handleSavePersonalInfo = async () => {
    setIsUpdatingClerk(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      if (!fullName) {
        toast.error("Please enter your name");
        setIsUpdatingClerk(false);
        return;
      }

      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email");
        setIsUpdatingClerk(false);
        return;
      }

      // Update name via Clerk - webhook will sync to Supabase
      await clerkUser?.update({
        firstName: firstName,
        lastName: lastName,
      });

      // Check if email changed
      const emailChanged = email !== originalValues.email;

      if (emailChanged && clerkUser) {
        try {
          // Add new email address to user
          const res = await createEmailAddress(email);

          // Reload user to get updated User object
          await clerkUser.reload();

          // Find the email address that was just added
          const newEmailAddress = clerkUser.emailAddresses.find(
            (a) => a.id === res?.id,
          );

          if (newEmailAddress) {
            // Create a reference to the email address
            setEmailObj(newEmailAddress);

            // Send verification code
            await newEmailAddress.prepareVerification({
              strategy: "email_code",
            });

            // Show verification dialog
            setShowVerificationDialog(true);
            toast.success("Verification code sent to your new email address", {
              duration: 5000,
            });
          }
        } catch (err) {
          console.error("Error updating email:", err);
          toast.error("Failed to update email. Please try again.");
          setIsUpdatingClerk(false);
          return;
        }
      } else {
        toast.success("Personal information updated successfully");
        // Wait a moment for webhook to process, then refetch
        setTimeout(async () => {
          await refetch();
        }, 1000);
      }
    } catch (err) {
      console.error("Error updating Clerk:", err);
      toast.error("An error occurred while updating");
    } finally {
      setIsUpdatingClerk(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }

    setIsVerifyingEmail(true);

    try {
      // Verify the code
      const emailVerifyAttempt = await emailObj?.attemptVerification({
        code: verificationCode,
      });

      if (emailVerifyAttempt?.verification.status === "verified") {
        // Set new email as primary
        if (emailObj && clerkUser) {
          await clerkUser.update({
            primaryEmailAddressId: emailObj.id,
          });

          // Now delete the old email address
          const oldEmailAddresses = clerkUser.emailAddresses.filter(
            (e) =>
              e.id !== emailObj.id && e.id !== clerkUser.primaryEmailAddressId,
          );

          // Delete all non-primary emails (cleanup)
          for (const oldEmail of oldEmailAddresses) {
            try {
              await oldEmail.destroy();
            } catch (err) {
              console.error("Error deleting old email:", err);
              // Continue even if deletion fails
            }
          }

          toast.success("Email updated successfully!");
        }

        setShowVerificationDialog(false);
        setVerificationCode("");

        // Reload user and wait for webhook to sync
        await clerkUser?.reload();
        setTimeout(async () => {
          await refetch();
        }, 1000);
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (err) {
      console.error("Error verifying email:", err);
      toast.error("Failed to verify email. Please try again.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleResendCode = async () => {
    try {
      if (emailObj) {
        await emailObj.prepareVerification({
          strategy: "email_code",
        });
        toast.success("Verification code resent to your email");
      }
    } catch (err) {
      console.error("Error resending code:", err);
      toast.error("Failed to resend code. Please try again.");
    }
  };

  const handleChangePassword = () => {
    setShowPasswordAlert(true);
  };

  const handleSavePrivacySettings = async () => {
    setIsSaving(true);
    try {
      const timezoneValue =
        typeof selectedTimezone === "string"
          ? selectedTimezone
          : selectedTimezone.value;

      // Validate working hours for enabled days
      const invalidDays = Object.entries(workingHours).filter(
        ([, hours]) => hours.enabled && hours.start >= hours.end,
      );

      if (invalidDays.length > 0) {
        toast.error("End time must be after start time for all enabled days");
        setIsSaving(false);
        return;
      }

      const success = await updateProfile({
        timezone: timezoneValue,
        tracking_enabled: trackingEnabled,
        privacy_settings: {
          ...profile?.privacy_settings,
          working_hours: workingHours,
        },
      });

      if (success) {
        toast.success("Privacy settings updated successfully");
        await refetch();
      } else {
        toast.error("Failed to update privacy settings");
      }
    } catch (err) {
      console.error("Error updating privacy settings:", err);
      toast.error("An error occurred while updating");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDayHours = (
    day: keyof WeeklyWorkingHours,
    field: keyof DayWorkingHours,
    value: string | boolean,
  ) => {
    setWorkingHours({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value,
      },
    });
  };

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const daysOfWeek: { key: keyof WeeklyWorkingHours; label: string }[] = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  if (!profile || !isLoaded) {
    return (
      <div className="space-y-6">
        {/* Personal Information Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Privacy Settings Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value="••••••••"
                  disabled
                  className="bg-gray-50"
                />
                <Button
                  variant="link"
                  size="sm"
                  className="absolute right-0 top-0 h-full text-primary hover:no-underline"
                  onClick={handleChangePassword}
                >
                  Change Password
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSavePersonalInfo}
              disabled={isUpdatingClerk || !hasPersonalInfoChanged}
            >
              {isUpdatingClerk && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Privacy Settings Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Privacy Settings
          </h3>

          <div className="space-y-6">
            {/* Timezone Selector */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <TimezoneSelect
                value={selectedTimezone}
                onChange={setSelectedTimezone}
                className="timezone-select"
              />
            </div>

            {/* Working Hours Table */}
            <div className="space-y-2">
              <Label>Working Hours</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Day
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                        Active
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Start Time
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        End Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {daysOfWeek.map(({ key, label }) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {label}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch
                            checked={workingHours[key].enabled}
                            onCheckedChange={(checked) =>
                              updateDayHours(key, "enabled", checked)
                            }
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Select
                            value={workingHours[key].start}
                            onValueChange={(value) =>
                              updateDayHours(key, "start", value)
                            }
                            disabled={!workingHours[key].enabled}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                {formatTime12Hour(workingHours[key].start)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {formatTime12Hour(time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4">
                          <Select
                            value={workingHours[key].end}
                            onValueChange={(value) =>
                              updateDayHours(key, "end", value)
                            }
                            disabled={!workingHours[key].enabled}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                {formatTime12Hour(workingHours[key].end)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {formatTime12Hour(time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500">
                Set your typical working hours for each day of the week
              </p>
            </div>

            {/* Activity Tracking */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="tracking">Activity Tracking</Label>
                <p className="text-sm text-gray-500">
                  Allow tracking of your work activities and time logs
                </p>
              </div>
              <Switch
                id="tracking"
                checked={trackingEnabled}
                onCheckedChange={setTrackingEnabled}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSavePrivacySettings}
              disabled={isSaving || !hasPrivacySettingsChanged}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change Alert Dialog */}
      <AlertDialog open={showPasswordAlert} onOpenChange={setShowPasswordAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              To change your password, please log out and use the &quot;Forgot
              Password&quot; option on the login page. This ensures your account
              remains secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter verification code</DialogTitle>
            <DialogDescription>
              We sent a 6-digit code to {email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyEmail}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="otp">Verification code</FieldLabel>
                <InputOTP
                  maxLength={6}
                  id="otp"
                  value={verificationCode}
                  onChange={setVerificationCode}
                  required
                >
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>
                  Enter the 6-digit code sent to your email.
                </FieldDescription>
              </Field>
              <FieldGroup>
                <Button type="submit" disabled={isVerifyingEmail}>
                  {isVerifyingEmail && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify
                </Button>
                <FieldDescription className="text-center">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-primary hover:underline"
                  >
                    Resend
                  </button>
                </FieldDescription>
              </FieldGroup>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
