import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://homebase.example.com'),
  title: {
    default: 'HomeBase — Modern real estate platform',
    template: '%s | HomeBase',
  },
  description:
    'Search premium listings, schedule tours, and manage your offers with a Zillow-level experience.',
  openGraph: {
    title: 'HomeBase — Modern real estate platform',
    description:
      'Search premium listings, schedule tours, and manage your offers with a Zillow-level experience.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeBase — Modern real estate platform',
    description:
      'Search premium listings, schedule tours, and manage your offers with a Zillow-level experience.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + ' bg-slate-950 text-slate-50'}>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          <Navbar />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-64 max-w-4xl rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

