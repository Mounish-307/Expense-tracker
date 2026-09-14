import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SpendSmart — AI-Powered Expense Tracker",
    template: "%s | SpendSmart",
  },
  description:
    "Track your expenses intelligently with AI-powered categorization, receipt scanning, and personalized spending insights. Built for modern India.",
  keywords: [
    "expense tracker",
    "budget manager",
    "AI finance",
    "personal finance India",
    "spending insights",
  ],
  openGraph: {
    title: "SpendSmart — AI-Powered Expense Tracker",
    description:
      "Track expenses with AI. Get smart insights, auto-categorization, and receipt scanning.",
    type: "website",
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
        className={`${inter.variable} font-sans antialiased bg-[#0f1117] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
