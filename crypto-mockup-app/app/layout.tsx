import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { sfProText } from "@/lib/fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const harmonyOSSans = localFont({
  src: [
    {
      path: "./fonts/HarmonyOS_Sans_Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HarmonyOS_Sans_Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      // No dedicated SemiBold cut in source set — Medium is closest for 600
      path: "./fonts/HarmonyOS_Sans_Medium.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/HarmonyOS_Sans_Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-harmonyos-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MD Mockup — Crypto Receipt Generator",
  description: "Crypto receipt mockup generator",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${harmonyOSSans.variable} ${sfProText.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
