import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Flow | Team Dashboard",
  description: "Focus Flow Team Dashboard",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
