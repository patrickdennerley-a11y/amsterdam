import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniMelb Match - Find Your Study Buddy",
  description:
    "AI-powered student matching platform for University of Melbourne students. Find compatible study buddies and friends based on your interests and major.",
  keywords: ["UniMelb", "University of Melbourne", "study buddy", "student matching", "friends"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
