import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Debate replay test',
  description: 'A stand-alone player for tracing how a partly watched debate resumes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
