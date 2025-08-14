// * Hooks 모듈 타입 정의

// * 브레이크포인트 타입
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// * 브레이크포인트 설정 타입
export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// * 미디어 쿼리 결과 타입
export interface MediaQueryResult {
  matches: boolean;
  media: string;
}

// * 윈도우 크기 타입
export interface WindowSize {
  width: number;
  height: number;
}

// * 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// * 반응형 훅 결과 타입
export interface ResponsiveHookResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  windowSize: WindowSize;
}
