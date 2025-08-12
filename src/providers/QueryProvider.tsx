'use client';

/**
 * React Query 전역 Provider
 * - 쿼리/뮤테이션 기본 옵션을 통일합니다.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // * 쿼리 기본 설정
            staleTime: 60 * 1000, // 1분
            gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            // * 뮤테이션 기본 설정
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="bottom"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
