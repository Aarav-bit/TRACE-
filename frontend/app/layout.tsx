import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "TRACE — Autonomous Digital Forensics Investigator",
  description: "Threat Reconstruction & Autonomous Cyber Evidence. Don't just detect. Investigate, verify, explain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fafbfc] text-slate-800 antialiased font-sans">
        {/* Top Floating Pill Navigation Bar (Matching Screenshot) */}
        <TopBar />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
