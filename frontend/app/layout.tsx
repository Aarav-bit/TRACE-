import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
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
      <body className="h-full flex overflow-hidden bg-[#eff2f6] text-slate-800 antialiased font-sans">
        {/* Floating Capsule Dock (Left) */}
        <Sidebar />

        {/* Main Content Floating Bento Window */}
        <div className="flex-1 my-3 mr-4 flex flex-col min-w-0 overflow-hidden bg-white/95 backdrop-blur-xl rounded-[32px] border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-slate-50/40 p-6 sm:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
