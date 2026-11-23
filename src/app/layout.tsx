import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConvoySync — Live Road-Trip Group Location & Ahead/Behind Tracker",
  description:
    "Real-time road-trip convoy tracker for friends & family in different cars. Track live distance apart, who is ahead or behind, and auto-zooming group radar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050911] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
