import type { Metadata } from "next";
import { Space_Grotesk, Poppins } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "police.ai - AI-Powered Emergency Dispatch",
  description: "Real-time AI-assisted emergency call management and dispatch system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
