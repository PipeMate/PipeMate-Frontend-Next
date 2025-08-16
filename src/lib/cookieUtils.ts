import { STORAGES } from '@/config/appConstants';
import type { CookieOptions, RepositoryConfig } from '@/contexts/types';

// * 쿠키 설정 상수
const COOKIE_DEFAULTS = {
  DEFAULT_EXPIRY_DAYS: 7,
  REPOSITORY_EXPIRY_DAYS: 30,
} as const;

// * 쿠키 유틸리티 모음
// * - 브라우저 호환성 개선
// * - 에러 핸들링 강화
// * - 타입 안전성 보장
// * 쿠키 저장 (localStorage 대안 포함)
export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  try {
    const {
      days = COOKIE_DEFAULTS.DEFAULT_EXPIRY_DAYS,
      secure = true,
      sameSite = 'Lax',
    } = options;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    // 브라우저 호환성을 위한 쿠키 설정
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost =
      typeof window !== 'undefined' && window.location.hostname === 'localhost';

    // 개발 환경이나 localhost에서는 Secure 플래그 제거
    const secureFlag = secure && !isDevelopment && !isLocalhost ? 'Secure; ' : '';

    // 더 간단한 쿠키 문자열 생성
    let cookieString = `${name}=${encodeURIComponent(
      value,
    )}; expires=${expires.toUTCString()}; path=/`;

    // SameSite 설정 추가 (브라우저 호환성을 위해 조건부)
    if (sameSite) {
      cookieString += `; SameSite=${sameSite}`;
    }

    // Secure 플래그 추가
    if (secureFlag) {
      cookieString += `; ${secureFlag}`;
    }

    console.log('쿠키 저장 시도:', {
      name,
      value: value.substring(0, 10) + '...',
      cookieString,
      isDevelopment,
      isLocalhost,
    });

    // 쿠키 저장 시도
    document.cookie = cookieString;

    // 저장 확인 (약간의 지연 후)
    setTimeout(() => {
      const savedValue = getCookie(name);
      if (savedValue !== value) {
        console.warn('쿠키 저장 실패:', {
          name,
          expected: value,
          actual: savedValue,
          cookieString,
        });

        // 쿠키 저장 실패 시 localStorage 대안 사용
        try {
          localStorage.setItem(name, value);
          console.log('localStorage 대안 저장 성공:', name);
        } catch (localStorageError) {
          console.error('localStorage 저장도 실패:', localStorageError);
        }
      } else {
        console.log('쿠키 저장 성공:', name);
      }
    }, 100);
  } catch (error) {
    console.error('쿠키 저장 오류:', {
      name,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cookieString: `${name}=${encodeURIComponent(value)}; expires=${new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toUTCString()}; path=/; SameSite=Lax`,
    });

    // 대안: 더 간단한 쿠키 저장 시도
    try {
      const simpleCookieString = `${name}=${encodeURIComponent(value)}; path=/`;
      document.cookie = simpleCookieString;
      console.log('간단한 쿠키 저장 시도:', simpleCookieString);
    } catch (fallbackError) {
      console.error('간단한 쿠키 저장도 실패:', fallbackError);

      // 최종 대안: localStorage 사용
      try {
        localStorage.setItem(name, value);
        console.log('localStorage 최종 대안 저장 성공:', name);
      } catch (localStorageError) {
        console.error('localStorage 저장도 실패:', localStorageError);
      }
    }

    throw error;
  }
};

// * 쿠키 읽기 (localStorage 대안 포함)
export const getCookie = (name: string): string | null => {
  try {
    if (typeof document === 'undefined') {
      return null;
    }

    // 먼저 쿠키에서 읽기 시도
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='))
      ?.split('=')[1];

    if (cookieValue) {
      return decodeURIComponent(cookieValue);
    }

    // 쿠키에 없으면 localStorage에서 읽기 시도
    try {
      const localStorageValue = localStorage.getItem(name);
      if (localStorageValue) {
        console.log('localStorage에서 값 읽기 성공:', name);
        return localStorageValue;
      }
    } catch (localStorageError) {
      console.warn('localStorage 읽기 실패:', localStorageError);
    }

    return null;
  } catch (error) {
    console.warn(`Failed to read cookie: ${name}`, error);
    return null;
  }
};

// * 쿠키 삭제 (localStorage 대안 포함)
export const deleteCookie = (name: string) => {
  try {
    // 쿠키 삭제
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log('쿠키 삭제 성공:', name);

    // localStorage에서도 삭제
    try {
      localStorage.removeItem(name);
      console.log('localStorage 삭제 성공:', name);
    } catch (localStorageError) {
      console.warn('localStorage 삭제 실패:', localStorageError);
    }
  } catch (error) {
    console.error('쿠키 삭제 오류:', { name, error });
  }
};

// * 레포지토리 설정 저장
// * - 30일 유효기간 설정
// * - 보안 설정 적용
export const setRepositoryConfig = (owner: string, repo: string) => {
  setCookie(STORAGES.REPOSITORY_OWNER, owner, {
    days: COOKIE_DEFAULTS.REPOSITORY_EXPIRY_DAYS,
  });
  setCookie(STORAGES.REPOSITORY_NAME, repo, {
    days: COOKIE_DEFAULTS.REPOSITORY_EXPIRY_DAYS,
  });
};

// * 레포지토리 설정 조회
// * - 타입 안전한 반환값
export const getRepositoryConfig = (): RepositoryConfig => {
  const owner = getCookie(STORAGES.REPOSITORY_OWNER);
  const repo = getCookie(STORAGES.REPOSITORY_NAME);
  return { owner, repo };
};

// * 레포지토리 설정 삭제
// * - 모든 관련 쿠키 제거
export const deleteRepositoryConfig = () => {
  deleteCookie(STORAGES.REPOSITORY_OWNER);
  deleteCookie(STORAGES.REPOSITORY_NAME);
};
