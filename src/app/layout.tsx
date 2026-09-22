import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#1A1A1A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NEXUS NEWS | The Premier Academic & Aspirant Daily",
  description: "A zero-storage editorial broadsheet curating essential dispatches for students and competitive exam aspirants. No tracking, real-time syncing.",
  keywords: ["UPSC", "News", "Geopolitics", "Economy", "Current Affairs", "India", "World"],
  metadataBase: new URL('http://localhost:3000'), // Adjust for prod domain later
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "NEXUS NEWS | Official Edition",
    description: "Curating essential dispatches for students and competitive exam aspirants.",
    siteName: "NEXUS NEWS",
    url: '/',
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "NEXUS NEWS | Official Edition",
    description: "Curating essential dispatches for students and competitive exam aspirants.",
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📰</text></svg>'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
