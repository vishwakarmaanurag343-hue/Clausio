import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://clausio.io"),
  title: "Clausio — AI Litigation Intelligence for Indian Advocates",
  description:
    "Clausio is an AI-powered litigation platform for Indian advocates. Draft court documents, research SC judgments, prepare hearings, and manage cases — all in one workspace.",
  keywords:
    "legal AI India, advocate software, litigation platform, court document drafting, Indian lawyer software, legal research India, bail application, case management, eCourts",
  openGraph: {
    title: "Clausio — AI Litigation Intelligence",
    description: "The intelligent workspace for Indian advocates.",
    url: "https://clausio.io",
    siteName: "Clausio",
    locale: "en_IN",
    type: "website",
  },
};

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} antialiased bg-[#F9F6F0] text-[#1A1A18] selection:bg-[#1A1A18] selection:text-[#F9F6F0]`}
    >
      <body className="min-h-screen bg-[#F9F6F0] text-[#1A1A18] font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

