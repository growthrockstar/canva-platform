import type { Metadata } from "next";

import "./globals.css";

import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";

const inter = Inter({
  variable: "--font-inter-v",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald-v",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Growth Rockstar Canvas",
  description: "Strategy Portfolio for Growth Rockstars",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${oswald.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
