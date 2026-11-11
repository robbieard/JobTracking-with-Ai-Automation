import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { AppPreferencesProvider } from "@/components/app-preferences";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobTracking | Pencarian kerja lebih terarah",
  description: "Temukan lowongan yang cocok, siapkan lamaran, dan pantau progres pencarian kerjamu bersama JobTracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><AppPreferencesProvider>{children}</AppPreferencesProvider></body>
    </html>
  );
}
