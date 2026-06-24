import type {Metadata} from 'next';
import { Inter, Playfair_Display, Kantumruy_Pro, Siemreap, Battambang, Koh_Santepheap, Moul } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer'],
  variable: '--font-kantumruy',
  display: 'swap',
  weight: ['400', '700'],
});

const siemreap = Siemreap({
  subsets: ['khmer'],
  variable: '--font-siemreap',
  display: 'swap',
  weight: '400',
});

const battambang = Battambang({
  subsets: ['khmer'],
  variable: '--font-battambang',
  display: 'swap',
  weight: ['400', '700'],
});

const kohSantepheap = Koh_Santepheap({
  subsets: ['khmer'],
  variable: '--font-koh-santepheap',
  display: 'swap',
  weight: ['400', '700'],
});

const moul = Moul({
  subsets: ['khmer'],
  variable: '--font-moul',
  display: 'swap',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Beauty Things | Premium Custom Handmade Nails Cambodia',
  description: 'Luxury handmade press-on nail studio in Cambodia. Browse modern Korean beauty designs, request custom press-ons, and track orders directly with Telegram notifications.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${kantumruy.variable} ${siemreap.variable} ${battambang.variable} ${kohSantepheap.variable} ${moul.variable}`}>
      <body className="font-sans antialiased bg-stone-50/50 text-stone-800" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
