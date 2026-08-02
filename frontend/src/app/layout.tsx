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
  title: "Vynra | Premium Video Platform by Karan OCH",
  description: "Vynra is a next-generation, premium video sharing experience created by Karan OCH (ohiocodehunter). Watch, share, and discover the best videos in stunning quality.",
  keywords: ["vynra", "ohiocodehunter", "Karan OCH", "video platform", "premium video sharing", "Karan", "video streaming"],
  authors: [{ name: "Karan OCH", url: "https://vynra.ohiocodehunter.com" }],
  creator: "Karan OCH (ohiocodehunter)",
  publisher: "ohiocodehunter",
  openGraph: {
    title: 'Vynra | Premium Video Platform by Karan OCH',
    description: 'A next-generation, premium video sharing experience by ohiocodehunter.',
    url: 'https://vynra.ohiocodehunter.com',
    siteName: 'Vynra',
    images: [
      {
        url: 'https://vynra.ohiocodehunter.com/globe.svg', // Placeholder og-image
        width: 1200,
        height: 630,
        alt: 'Vynra by Karan OCH',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vynra | Premium Video Platform',
    description: 'Join Vynra by Karan OCH (ohiocodehunter) for a premium video sharing experience.',
    creator: '@ohiocodehunter',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
