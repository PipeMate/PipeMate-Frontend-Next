import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRepository } from '@/contexts/RepositoryContext';
import { getCookie } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';

export function useSetupGuard() {
  const router = useRouter();
  const { isConfigured } = useRepository();
  const [hasToken, setHasToken] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetup = () => {
      const token = getCookie(STORAGES.GITHUB_TOKEN);
      setHasToken(!!token);
      setIsChecking(false);
    };

    // 약간의 지연을 두어 초기 렌더링 완료 후 설정 확인
    const timer = setTimeout(checkSetup, 100);
    return () => clearTimeout(timer);
  }, []);

  const redirectToSetup = (currentPath: string) => {
    const redirectUrl = encodeURIComponent(currentPath);
    router.push(`/setup?redirect=${redirectUrl}`);
  };

  const isSetupRequired = !isConfigured || !hasToken;
  const isReady = !isChecking;

  return {
    isConfigured,
    hasToken,
    isChecking,
    isSetupRequired,
    isReady,
    redirectToSetup,
  };
}
