import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tiktiki - Travel Intelligence & Smart Route Hacks',
  description: 'Find smarter routes. Discover hidden intermediate seat quotas and bypass waitlists.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
