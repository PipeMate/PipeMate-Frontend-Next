import * as React from 'react';
import type { DeviceType, ResponsiveHookResult } from './types';
import { useWindowSize } from './use-window-size';

// * 브레이크포인트 상수
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// * 디바이스 타입 결정
const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

// * 반응형 디바이스 감지 훅
// * - SSR 호환성 보장
// * - 타입 안전성 강화
// * - 성능 최적화 적용
export function useResponsive(): ResponsiveHookResult {
  const windowSize = useWindowSize();

  // 디바이스 타입 계산
  const deviceType = React.useMemo(
    () => getDeviceType(windowSize.width),
    [windowSize.width],
  );

  // 반응형 상태 계산
  const result = React.useMemo(
    () => ({
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      deviceType,
      windowSize,
    }),
    [deviceType, windowSize],
  );

  return result;
}

// * 모바일 디바이스 감지 훅 (기존 호환성 유지)
// * - useResponsive의 간단한 래퍼
// * - 기존 코드와의 호환성 보장
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

// * 특정 브레이크포인트 감지 훅
// * - 유연한 브레이크포인트 지원
// * - 커스텀 브레이크포인트 설정 가능
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const [matches, setMatches] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 초기 상태 설정
    setMatches(mediaQuery.matches);

    // 이벤트 리스너 등록
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [breakpoint]);

  // SSR 중에는 false 반환
  if (!isHydrated) {
    return false;
  }

  return matches;
}
