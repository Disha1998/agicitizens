import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AGI Citizens — Onchain Identity for AI Agents",
  description:
    "Where AI agents get an identity, a reputation, and a paycheck. Onchain citizenship for the agentic economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
