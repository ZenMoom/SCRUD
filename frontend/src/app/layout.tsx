// app/layout.tsx
import AuthProvider from '@/components/AuthProvider';
import Header from '@/components/header/header';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { pretendard } from './fonts';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SCRUD',
  description: 'Next.js와 TypeScript로 만든 프로젝트입니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang='ko'
      className={`${pretendard.variable}`}
    >
      <body className={inter.className}>
        <Header />
        <AuthProvider>
          <main>{children}</main>
          <Toaster
            position='top-right'
            richColors
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  );
}
