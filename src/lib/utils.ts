import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 파일명에서 .yml 확장자를 제거하는 유틸리티 함수
 * 백엔드에서 자동으로 .yml을 추가하므로 중복을 방지
 */
export function removeYmlExtension(fileName: string): string {
  if (fileName.endsWith(".yml") || fileName.endsWith(".yaml")) {
    return fileName.replace(/\.(yml|yaml)$/, "");
  }
  return fileName;
}

/**
 * 파일명에 .yml 확장자가 있는지 확인하는 유틸리티 함수
 */
export function hasYmlExtension(fileName: string): boolean {
  return fileName.endsWith(".yml") || fileName.endsWith(".yaml");
}
