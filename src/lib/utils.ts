import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 클래스 병합 유틸리티
 * - 같은 속성의 중복 클래스를 안전하게 병합합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 파일명에서 .yml/.yaml 확장자를 제거합니다.
 * - 백엔드가 확장자를 자동으로 덧붙이는 경우 중복 방지 목적
 */
export function removeYmlExtension(fileName: string): string {
  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    return fileName.replace(/\.(yml|yaml)$/, '');
  }
  return fileName;
}

/**
 * 파일명이 .yml/.yaml 확장자를 포함하는지 여부를 반환합니다.
 */
export function hasYmlExtension(fileName: string): boolean {
  return fileName.endsWith('.yml') || fileName.endsWith('.yaml');
}
