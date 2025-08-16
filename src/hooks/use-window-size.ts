import * as React from 'react';
import type { WindowSize } from './types';

// * SSR 안전한 윈도우 크기 가져오기
const getInitialWindowSize = (): WindowSize => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

// * 윈도우 크기 감지 훅
// * - SSR 호환성 보장
// * - 성능 최적화 (디바운싱 적용)
// * - 타입 안전성 강화
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = React.useState<WindowSize>(getInitialWindowSize);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // 하이드레이션 완료 감지
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 윈도우 크기 변경 감지 (디바운싱 적용)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100); // 100ms 디바운싱
    };

    // 초기 크기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // SSR 중에는 기본값 반환
  if (!isHydrated) {
    return { width: 0, height: 0 };
  }

  return windowSize;
}

// * 윈도우 너비만 감지하는 훅
// * - 성능 최적화 (너비만 필요한 경우)
export function useWindowWidth(): number {
  const { width } = useWindowSize();
  return width;
}

// * 윈도우 높이만 감지하는 훅
// * - 성능 최적화 (높이만 필요한 경우)
export function useWindowHeight(): number {
  const { height } = useWindowSize();
  return height;
}
