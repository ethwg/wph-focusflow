import { ReactNode } from "react";
import { Metadata } from "next";
import { PublishFocusReportButton } from "@/app/(client)/_components/PublishFocusReportButton";

export const metadata: Metadata = {
  title: "Focus Flow | Dashboard Home",
  description: "Focus Flow Dashboard Home",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      {children} <PublishFocusReportButton />
    </div>
  );
}
