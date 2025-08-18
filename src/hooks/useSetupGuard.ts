'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookieUtils';
import { getRepositoryConfig } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';
import { useRepository } from '@/contexts/RepositoryContext';

interface UseSetupGuardOptions {
  redirectTo?: string;
  requireToken?: boolean;
  requireRepository?: boolean;
  onSetupChange?: (hasToken: boolean, hasRepository: boolean) => void;
}

export function useSetupGuard({
  redirectTo = '/setup',
  requireToken = true,
  requireRepository = true,
  onSetupChange,
}: UseSetupGuardOptions = {}) {
  const router = useRouter();
  const { isConfigured } = useRepository();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [hasRepository, setHasRepository] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // * 설정 상태를 확인하는 함수
  const checkSetupStatus = () => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    const repoConfig = getRepositoryConfig();
    const tokenExists = !!token;
    const repositoryExists = !!(repoConfig.owner && repoConfig.repo);

    setHasToken(tokenExists);
    setHasRepository(repositoryExists);

    // * 콜백 호출
    onSetupChange?.(tokenExists, repositoryExists);

    return { tokenExists, repositoryExists };
  };

  // * 초기 설정 상태 확인
  useEffect(() => {
    const { tokenExists, repositoryExists } = checkSetupStatus();
    setIsChecking(false);
  }, []);

  // * 설정 변경 감지
  useEffect(() => {
    const handleSetupChange = () => {
      const { tokenExists, repositoryExists } = checkSetupStatus();

      // * 필수 설정이 누락된 경우 리다이렉트
      if (requireToken && !tokenExists) {
        router.push(redirectTo);
        return;
      }

      if (requireRepository && !repositoryExists) {
        router.push(redirectTo);
        return;
      }
    };

    // * 토큰 변경 이벤트 리스너
    window.addEventListener('token-changed', handleSetupChange);

    // * 레포지토리 변경 이벤트 리스너
    window.addEventListener('repository-changed', handleSetupChange);

    return () => {
      window.removeEventListener('token-changed', handleSetupChange);
      window.removeEventListener('repository-changed', handleSetupChange);
    };
  }, [requireToken, requireRepository, redirectTo, router]);

  // * RepositoryContext 변경 감지
  useEffect(() => {
    if (hasRepository !== null) {
      setHasRepository(isConfigured);
    }
  }, [isConfigured, hasRepository]);

  // * 현재 설정 상태 계산 - null 체크 추가
  const isSetupValid =
    !isChecking &&
    (!requireToken || hasToken === true) &&
    (!requireRepository || hasRepository === true);

  return {
    hasToken,
    hasRepository,
    isSetupValid,
    isChecking,
    checkSetupStatus,
  };
}
