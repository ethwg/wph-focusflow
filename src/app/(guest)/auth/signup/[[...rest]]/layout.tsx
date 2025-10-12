import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Focus Flow | Sign Up",
    description: "Focus Flow Sign Up",
};

export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
}
