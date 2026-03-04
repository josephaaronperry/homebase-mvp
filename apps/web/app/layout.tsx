import type { Metadata } from 'next';
import './globals.css';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastProvider } from '@/components/ToastProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://homebase.example.com'),
  title: {
    default: 'HomeBase — Buy your home. Keep the commission.',
    template: '%s | HomeBase',
  },
  description:
    'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
  openGraph: {
    title: 'HomeBase — Buy your home. Keep the commission.',
    description:
      'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'HomeBase' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeBase — Buy your home. Keep the commission.',
    description:
      'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}

