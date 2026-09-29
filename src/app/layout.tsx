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
  metadataBase: new URL('https://nexus24news.vercel.app'),
  title: {
    default: 'Nexus News | Daily Editorial & Current Affairs for Aspirants',
    template: '%s | Nexus News'
  },
  description: 'Real-time breaking news, PIB releases, and national editorial analysis curated for UPSC, State PSC, and competitive examination aspirants in Hindi and English.',
  keywords: [
    'UPSC Current Affairs',
    'PIB News Hindi',
    'The Hindu Editorial Analysis',
    'Daily Aspirant News',
    'Civil Services News Portal',
    'Nexus News 24'
  ],
  authors: [{ name: 'Nexus News Editorial Desk' }],
  creator: 'Nexus News',
  publisher: 'Nexus News',
  applicationName: 'Nexus News',
  category: 'News & Current Affairs',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large', // Mandatory for Google Discover recommendations
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://nexus24news.vercel.app',
    languages: {
      'en-IN': 'https://nexus24news.vercel.app/?lang=en',
      'hi-IN': 'https://nexus24news.vercel.app/?lang=hi',
    },
  },
  openGraph: {
    title: 'Nexus News | The Premier Academic & Aspirant Daily',
    description: 'Comprehensive daily news aggregation and editorial dispatches for civil services aspirants.',
    url: 'https://nexus24news.vercel.app',
    siteName: 'Nexus News',
    locale: 'hi_IN',
    alternateLocale: ['en_IN'],
    type: 'website',
    images: [
      {
        url: 'https://nexus24news.vercel.app/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'Nexus News Editorial Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus News | Aspirant Daily',
    description: 'Daily editorial & current affairs aggregation for competitive aspirants.',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📰</text></svg>'
  },
  verification: {
    google: 'zydQkxmhYdGARmUlgRFqYRnjH-3sBfMeGC9P5aHs0ZY',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="zydQkxmhYdGARmUlgRFqYRnjH-3sBfMeGC9P5aHs0ZY" />
      </head>
      <body className={`${playfair.variable} ${inter.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
