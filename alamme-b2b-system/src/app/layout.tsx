import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alamme B2B & Reseller System',
  description: 'Order, PNL, Poin, dan Fulfillment System — Alamme',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans">{children}</body>
    </html>
  );
}
