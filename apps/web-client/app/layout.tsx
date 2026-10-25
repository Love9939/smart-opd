import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
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
  title: "SmartOPD & DentalFlow | High-Speed Clinical Cockpit & Waiting Room Hub",
  description: "Unified multi-tenant clinical cockpit engineered for General Physician OPDs and Dental Practices with sub-5ms WebSocket state sync and offline resilience.",
  applicationName: "SmartOPD & DentalFlow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartOPD",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfbf9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fbfbf9] text-[#33332e] font-sans selection:bg-[#e60023] selection:text-white">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
