import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sprintify | The Hybrid Project Management Platform (Agile + Waterfall)",
  description:
    "Stop choosing between speed and control. Manage complex projects with integrated Gantt Charts, Scrum Boards, and WSJF Prioritization. Perfect for R&D, Engineering, and Marketing.",
  keywords: [
    "Hybrid Project Management",
    "Agile vs Waterfall",
    "Scrum Board",
    "Gantt Chart Online",
    "Stage-Gate Software",
    "WSJF Tool",
    "Project Planning",
    "Agile Waterfall Integration",
    "WSJF Prioritization",
    "Planning Poker",
    "WIP Limits",
    "Sprint Planning",
  ],
  openGraph: {
    title: "Sprintify | Agile + Waterfall in One Platform",
    description:
      "Seamlessly switch between Scrum Boards and Gantt Charts. WSJF Prioritization, Planning Poker, WIP Limits, and more.",
    siteName: "Sprintify",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sprintify | The Hybrid Project Management Platform",
    description:
      "Agile speed. Waterfall control. Manage complex projects with integrated Gantt Charts, Scrum Boards, and WSJF Prioritization.",
  },
  metadataBase: new URL("https://sprintify.org"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TRPCProvider>
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
