import { STORAGES } from "@/config/appConstants";

// * 쿠키 저장
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Strict`;
};

// * 쿠키 읽기
export const getCookie = (name: string): string | null => {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
};

// * 쿠키 삭제
export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// * 레포지토리 설정 저장
export const setRepositoryConfig = (owner: string, repo: string) => {
  setCookie(STORAGES.REPOSITORY_OWNER, owner, 30);
  setCookie(STORAGES.REPOSITORY_NAME, repo, 30);
};

// * 레포지토리 설정 조회
export const getRepositoryConfig = () => {
  const owner = getCookie(STORAGES.REPOSITORY_OWNER);
  const repo = getCookie(STORAGES.REPOSITORY_NAME);
  return { owner, repo };
};

// * 레포지토리 설정 삭제
export const deleteRepositoryConfig = () => {
  deleteCookie(STORAGES.REPOSITORY_OWNER);
  deleteCookie(STORAGES.REPOSITORY_NAME);
};
