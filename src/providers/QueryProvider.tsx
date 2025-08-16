'use client';

// * React Query 전역 Provider
// * - 쿼리/뮤테이션 기본 옵션을 통일합니다.
// * - 타입 안전성 보장
// * - 성능 최적화 적용
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useMemo } from 'react';
import type { ProviderProps, QueryClientOptions, DevtoolsConfig } from './types';

// * Query Client 설정 상수
const QUERY_CONFIG: QueryClientOptions = {
  queries: {
    staleTime: 60 * 1000, // 1분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 1,
  },
} as const;

// * Devtools 설정 상수
const DEVTOOLS_CONFIG: DevtoolsConfig = {
  initialIsOpen: false,
  position: 'bottom',
  buttonPosition: 'bottom-right',
} as const;

// * QueryProvider
// * - React Query 클라이언트 설정
// * - 개발 도구 포함
// * - 성능 최적화 적용
export default function QueryProvider({ children }: ProviderProps) {
  // QueryClient 인스턴스를 메모이제이션하여 불필요한 재생성 방지
  const queryClient = useMemo(
    () => new QueryClient({ defaultOptions: QUERY_CONFIG }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 Devtools 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={DEVTOOLS_CONFIG.initialIsOpen}
          position={DEVTOOLS_CONFIG.position}
          buttonPosition={DEVTOOLS_CONFIG.buttonPosition}
        />
      )}
    </QueryClientProvider>
  );
}
