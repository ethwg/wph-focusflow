import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Flow | Login",
  description: "Focus Flow Login",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
