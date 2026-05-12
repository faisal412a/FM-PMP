import "./globals.css";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Project Management System",
  description: "Mini PMS for projects, finance, progress, suppliers, dashboards, and reports"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>{user ? <Shell user={user}>{children}</Shell> : children}</body>
    </html>
  );
}
