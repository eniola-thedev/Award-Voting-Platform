import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NAQSS Award and Prom Night — Vote Now',
  description: 'Support your favourite contestant at the NAQSS Award and Prom Night.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
