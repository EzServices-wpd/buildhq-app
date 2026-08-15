import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildHq – Design. Check. Build.",
  description:
    "Interactive AI workspace for custom closets and built-ins. Get cut lists, materials, and assembly instructions in one click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
