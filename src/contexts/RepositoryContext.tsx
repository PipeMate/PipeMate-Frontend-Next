'use client';

// * 저장소 선택/설정을 전역으로 관리하는 컨텍스트
// * - 쿠키 기반 영구 저장
// * - 타입 안전성 보장
// * - 성능 최적화 적용
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  getRepositoryConfig,
  setRepositoryConfig,
  deleteRepositoryConfig,
} from '@/lib/cookieUtils';
import type { RepositoryContextType, RepositoryProviderProps } from './types';

// * 에러 메시지 상수
const ERROR_MESSAGES = {
  CONTEXT_NOT_FOUND: 'useRepository must be used within a RepositoryProvider',
} as const;

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

// * RepositoryProvider
// * - 초기 마운트 시 쿠키에서 설정을 복원합니다.
// * - 성능 최적화를 위해 useCallback과 useMemo 적용
export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const [owner, setOwner] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // 초기 로드 시 쿠키에서 설정 불러오기
  useEffect(() => {
    const config = getRepositoryConfig();
    if (config.owner && config.repo) {
      setOwner(config.owner);
      setRepo(config.repo);
      setIsConfigured(true);
    }
  }, []);

  // * 저장소 설정
  // * - useCallback으로 불필요한 리렌더링 방지
  const setRepository = useCallback((newOwner: string, newRepo: string) => {
    setOwner(newOwner);
    setRepo(newRepo);
    setIsConfigured(true);
    setRepositoryConfig(newOwner, newRepo);
  }, []);

  // * 저장소 설정 초기화
  // * - useCallback으로 불필요한 리렌더링 방지
  const clearRepository = useCallback(() => {
    setOwner(null);
    setRepo(null);
    setIsConfigured(false);
    deleteRepositoryConfig();
  }, []);

  // 컨텍스트 값 메모이제이션
  const value = useMemo<RepositoryContextType>(
    () => ({
      owner,
      repo,
      isConfigured,
      setRepository,
      clearRepository,
    }),
    [owner, repo, isConfigured, setRepository, clearRepository],
  );

  return (
    <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
  );
}

// * Repository 컨텍스트 사용 훅
// * - 타입 안전성 보장
// * - 명확한 에러 메시지 제공
export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error(ERROR_MESSAGES.CONTEXT_NOT_FOUND);
  }
  return context;
}
