import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navigation from "@/components/navigation";
import { Suspense } from "react";
import TopBar from "@/components/layout/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OpenF1 Data Platform",
  description: "Advanced Formula 1 telemetry and race analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen flex flex-col md:flex-row`}
      >
        <Providers>
          <Suspense fallback={<div className="w-20 hidden md:block shrink-0 bg-[var(--color-surface-1)] h-screen border-r border-[var(--color-border-subtle)]"></div>}>
            <Navigation />
          </Suspense>
          <main className="flex-1 w-full overflow-y-auto h-screen bg-[var(--color-bg-base)]">
            <TopBar />
            <div className="px-4 2xl:px-8 pt-0 pb-24 md:pb-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
