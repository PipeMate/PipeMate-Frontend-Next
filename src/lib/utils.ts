import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FileInfo, ErrorInfo, LogLevelType } from './types';

// * 로깅 유틸리티
const LOG_LEVELS: Record<LogLevelType, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL: LogLevelType = (
  process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
) as LogLevelType;

// * 로깅 유틸리티
// * - 환경별 로그 레벨 제어
// * - 개발/프로덕션 환경 구분
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, error?: Error | unknown, ...args: any[]) => {
    if (LOG_LEVELS[CURRENT_LOG_LEVEL] <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  },
};

// * Tailwind 클래스 병합 유틸리티
// * - 같은 속성의 중복 클래스를 안전하게 병합합니다.
// * - 타입 안전성 보장
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// * 파일 정보 파싱 유틸리티
// * - 파일명에서 이름과 확장자 분리
// * - 타입 안전한 파일 정보 반환
export function parseFileInfo(fileName: string): FileInfo {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return {
      name: fileName,
      extension: '',
      hasExtension: false,
    };
  }

  return {
    name: fileName.substring(0, lastDotIndex),
    extension: fileName.substring(lastDotIndex + 1),
    hasExtension: true,
  };
}

// * 파일명에서 .yml/.yaml 확장자를 제거합니다.
// * - 백엔드가 확장자를 자동으로 덧붙이는 경우 중복 방지 목적
// * - 타입 안전성 보장
export function removeYmlExtension(fileName: string): string {
  if (!fileName) return fileName;

  const fileInfo = parseFileInfo(fileName);

  if (
    fileInfo.extension.toLowerCase() === 'yml' ||
    fileInfo.extension.toLowerCase() === 'yaml'
  ) {
    return fileInfo.name;
  }

  return fileName;
}

// * 파일명이 .yml/.yaml 확장자를 포함하는지 여부를 반환합니다.
// * - 대소문자 구분 없이 검사
export function hasYmlExtension(fileName: string): boolean {
  if (!fileName) return false;

  const fileInfo = parseFileInfo(fileName);
  const extension = fileInfo.extension.toLowerCase();

  return extension === 'yml' || extension === 'yaml';
}

// * 안전한 문자열 변환 유틸리티
// * - null, undefined, 숫자 등을 안전하게 문자열로 변환
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// * 딜레이 유틸리티
// * - Promise 기반 지연 함수
// * - 비동기 작업에서 사용
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// * 디바운스 유틸리티
// * - 연속된 함수 호출을 제한
// * - 성능 최적화에 사용
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// * 에러 정보 추출 유틸리티
// * - 다양한 에러 타입에서 일관된 정보 추출
// * - 타입 안전한 에러 정보 반환
export function extractErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
      details: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: (error as any).code,
      status: (error as any).status,
      details: error,
    };
  }

  return {
    message: '알 수 없는 오류가 발생했습니다.',
    details: error,
  };
}
