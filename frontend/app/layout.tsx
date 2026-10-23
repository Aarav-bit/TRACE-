import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";
import GradientASCII from "@/components/common/GradientASCII";

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
      <body className="min-h-full flex flex-col bg-[#fafbfc] text-slate-800 antialiased font-sans relative">
        {/* Full-screen ASCII Gradient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <GradientASCII
            colors={['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']}
            shape="horizon"
            characters=" =+xX0S8#@"
            cellSize={18}
            density={0.8}
            scale={1.2}
            lightMode={true}
            gradientOpacity={0.7}
            glyphOpacity={0.85}
            className="w-full h-full"
            style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
          />
        </div>

        {/* Top Floating Pill Navigation Bar (Matching Screenshot) */}
        <TopBar />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
