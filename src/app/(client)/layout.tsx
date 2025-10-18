import { ReactNode } from "react";
import { Metadata } from "next";
import { NavHeader } from "@/components/shared/client-header/nav-header";

export const metadata: Metadata = {
  title: "Focus Flow",
  description: "Focus Flow",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <NavHeader />
      <div className="px-3 ">{children}</div>
    </div>
  );
}
