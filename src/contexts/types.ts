import type { ReactNode } from 'react';

// * Repository 컨텍스트 관련 타입 정의

export interface RepositoryContextType {
  owner: string | null;
  repo: string | null;
  isConfigured: boolean;
  setRepository: (owner: string, repo: string) => void;
  clearRepository: () => void;
}

export interface RepositoryProviderProps {
  children: ReactNode;
}

// * 쿠키 관련 타입 정의

export interface CookieOptions {
  days?: number;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface RepositoryConfig {
  owner: string | null;
  repo: string | null;
}
