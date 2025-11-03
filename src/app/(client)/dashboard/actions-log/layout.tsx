import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Flow | Action Logs",
  description: "Focus Flow Action Logs",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
