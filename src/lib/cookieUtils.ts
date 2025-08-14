import { STORAGES } from '@/config/appConstants';
import type { CookieOptions, RepositoryConfig } from '@/contexts/types';

// * 쿠키 설정 상수
const COOKIE_DEFAULTS = {
  DEFAULT_EXPIRY_DAYS: 7,
  REPOSITORY_EXPIRY_DAYS: 30,
  SECURE_SETTINGS: 'Secure; SameSite=Strict',
} as const;

// * 쿠키 유틸리티 모음
// * - 보안 설정(Secure, SameSite) 기본 적용
// * - 타입 안전성 보장
export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  const {
    days = COOKIE_DEFAULTS.DEFAULT_EXPIRY_DAYS,
    secure = true,
    sameSite = 'Strict',
  } = options;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const secureSettings = secure ? `Secure; SameSite=${sameSite}` : '';

  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expires.toUTCString()}; path=/; ${secureSettings}`.trim();
};

// * 쿠키 읽기
// * - 안전한 디코딩 처리
export const getCookie = (name: string): string | null => {
  try {
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='))
      ?.split('=')[1];

    return value ? decodeURIComponent(value) : null;
  } catch (error) {
    console.warn(`Failed to read cookie: ${name}`, error);
    return null;
  }
};

// * 쿠키 삭제
// * - 명시적인 만료 시간 설정
export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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
