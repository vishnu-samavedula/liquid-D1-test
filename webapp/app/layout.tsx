import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D1 Workbench",
  description: "A local interface for testing Liquid decision models.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
