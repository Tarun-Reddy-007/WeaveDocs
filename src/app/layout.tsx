import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Providers } from './providers';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'WeaveDocs - Turn static documents into seamless web experiences',
  description: 'WeaveDocs: Transform your static documents into interactive web experiences',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="flex flex-col min-h-screen bg-neutral-950">
        <Navbar />
        <Providers>
          <main className="flex-1">
            {children}
          </main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
