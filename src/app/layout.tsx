import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://formuladata.miosmooth.com"),
  title: { default: "Formula Data", template: "%s | Formula Data" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://formuladata.miosmooth.com",
    siteName: "Formula Data",
    title: "Formula Data — F1 Telemetry & Race Analysis",
    description: "Explore F1 timing, telemetry, strategy and racing results.",
  },
  description: "F1 Data and Telemetry Platform",
  verification: {
    google: "wRwGwt4Cmi-4UpGY2YHnDKE4VkY0j-RiyPfsZr6gbl0",
  },
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
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-white px-4 py-2 text-black focus:not-sr-only">Skip to main content</a>
        <Providers>
          <Suspense fallback={<div className="w-20 hidden md:block shrink-0 bg-[var(--color-surface-1)] h-screen border-r border-[var(--color-border-subtle)]"></div>}>
            <Navigation />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="h-screen min-w-0 w-full flex-1 overflow-y-auto bg-[var(--color-bg-base)]">
            <TopBar />
            <div className="px-4 pb-28 pt-0 sm:px-6 md:pb-10 lg:px-8 2xl:px-10">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
