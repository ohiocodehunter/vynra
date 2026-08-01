import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vynra | Premium Video Platform",
  description: "A next-generation, premium video sharing experience.",
};

import { AuthProvider } from '@/context/AuthContext';
import GlobalProtection from '@/components/layout/GlobalProtection';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>
          <GlobalProtection />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
