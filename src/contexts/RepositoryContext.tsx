'use client';

/**
 * 저장소 선택/설정을 전역으로 관리하는 컨텍스트
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getRepositoryConfig,
  setRepositoryConfig,
  deleteRepositoryConfig,
} from '@/lib/cookieUtils';

/**
 * Repository 컨텍스트 값 인터페이스
 */
interface RepositoryContextType {
  owner: string | null;
  repo: string | null;
  isConfigured: boolean;
  setRepository: (owner: string, repo: string) => void;
  clearRepository: () => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

interface RepositoryProviderProps {
  children: ReactNode;
}

/**
 * RepositoryProvider
 * - 초기 마운트 시 쿠키에서 설정을 복원합니다.
 */
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

  /**
   * 저장소 설정
   */
  const setRepository = (newOwner: string, newRepo: string) => {
    setOwner(newOwner);
    setRepo(newRepo);
    setIsConfigured(true);
    setRepositoryConfig(newOwner, newRepo);
  };

  /**
   * 저장소 설정 초기화
   */
  const clearRepository = () => {
    setOwner(null);
    setRepo(null);
    setIsConfigured(false);
    deleteRepositoryConfig();
  };

  const value: RepositoryContextType = {
    owner,
    repo,
    isConfigured,
    setRepository,
    clearRepository,
  };

  return (
    <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
  );
}

/**
 * Repository 컨텍스트 사용 훅
 */
export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
