"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getRepositoryConfig,
  setRepositoryConfig,
  deleteRepositoryConfig,
} from "@/lib/cookieUtils";

interface RepositoryContextType {
  owner: string | null;
  repo: string | null;
  isConfigured: boolean;
  setRepository: (owner: string, repo: string) => void;
  clearRepository: () => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(
  undefined
);

interface RepositoryProviderProps {
  children: ReactNode;
}

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

  const setRepository = (newOwner: string, newRepo: string) => {
    setOwner(newOwner);
    setRepo(newRepo);
    setIsConfigured(true);
    setRepositoryConfig(newOwner, newRepo);
  };

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
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return context;
}
