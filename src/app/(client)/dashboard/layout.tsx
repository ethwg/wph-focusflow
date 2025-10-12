import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Flow | Dashboard Home",
  description: "Focus Flow Dashboard Home",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
