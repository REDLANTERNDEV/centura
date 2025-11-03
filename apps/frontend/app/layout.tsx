import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

const Sans = Source_Sans_3({
  variable: '--font-source-sans-3',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title:
    "Centura — Yeni Nesil ERP Çözümleri | KOBİ'ler için Hızlı, Ölçeklenebilir Yönetim",
  description:
    "Centura, KOBİ'lere yönelik yeni nesil ERP: finans, stok, satış ve raporlama modülleriyle süreçlerinizi hızlandırır. Hızlı kurulum, ölçeklenebilir fiyatlandırma ve Türkçe destek sunar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='tr' suppressHydrationWarning>
      <body className={`${Sans.className} antialiased`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
