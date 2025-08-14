import type { Metadata } from 'next';
import '@/styles';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Header, MainLayout, AppSidebar, LayoutProvider } from '@/components/layout';
import { ErrorBoundaryProvider } from '@/providers';
import QueryProvider from '@/providers/QueryProvider';
import ToastProvider from '@/providers/ToastProvider';
import { RepositoryProvider } from '@/contexts/RepositoryContext';

export const metadata: Metadata = {
  title: 'PipeMate - GitHub Actions 워크플로우 관리',
  description: 'GitHub Actions 워크플로우를 시각적으로 관리하고 모니터링하는 강력한 도구',
  keywords: ['GitHub Actions', 'CI/CD', '워크플로우', '파이프라인', '모니터링'],
  authors: [{ name: 'PipeMate Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

// * 애플리케이션 루트 레이아웃
// * - 전역 Provider 및 레이아웃을 구성합니다.
// * - 에러 바운더리, 쿼리 캐싱, 토스트 알림을 포함합니다.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="antialiased bg-gray-100 h-full">
        <ErrorBoundaryProvider>
          <QueryProvider>
            <RepositoryProvider>
              <SidebarProvider>
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
