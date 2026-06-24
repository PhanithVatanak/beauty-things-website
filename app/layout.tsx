import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Beauty Things | Premium Custom Handmade Nails Cambodia',
  description: 'Luxury handmade press-on nail studio in Cambodia. Browse modern Korean beauty designs, request custom press-ons, and track orders directly with Telegram notifications.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-stone-50/50 text-stone-800" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
