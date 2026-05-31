import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'FlashLink — Lightning Fast URL Shortener',
  description: 'Create short, powerful links in milliseconds. Track clicks, analyze traffic, and grow your brand with FlashLink.',
  keywords: ['url shortener', 'link shortener', 'analytics', 'short url', 'flashlink'],
  openGraph: {
    title: 'FlashLink — Lightning Fast URL Shortener',
    description: 'Create short, powerful links in milliseconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-950 text-white min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
