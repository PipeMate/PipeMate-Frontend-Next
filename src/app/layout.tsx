import type { Metadata, Viewport } from 'next';
import '@/styles';
import { Inter } from 'next/font/google';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Header, MainLayout, AppSidebar, LayoutProvider } from '@/components/layout';
import { ErrorBoundaryProvider } from '@/providers';
import QueryProvider from '@/providers/QueryProvider';
import ToastProvider from '@/providers/ToastProvider';
import { RepositoryProvider } from '@/contexts/RepositoryContext';

// Inter 폰트 설정
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PipeMate',
  description: 'GitHub Actions 워크플로우를 시각적으로 관리하고 모니터링하는 강력한 도구',
  keywords: ['GitHub Actions', 'CI/CD', '워크플로우', '파이프라인', '모니터링'],
  authors: [{ name: 'PipeMate Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// * 애플리케이션 루트 레이아웃
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${inter.variable}`}>
      <body className="antialiased bg-gray-100 h-full font-sans">
        <ErrorBoundaryProvider>
          <QueryProvider>
            <RepositoryProvider>
              <SidebarProvider defaultOpen={false}>
                <LayoutProvider>
                  <AppSidebar />
                  <SidebarInset className="relative flex flex-col min-h-screen">
                    <Header />
                    <MainLayout>{children}</MainLayout>
                    <ToastProvider />
                  </SidebarInset>
                </LayoutProvider>
              </SidebarProvider>
            </RepositoryProvider>
          </QueryProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
