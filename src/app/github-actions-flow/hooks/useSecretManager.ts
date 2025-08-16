'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSecrets, useCreateOrUpdateSecret, useDeleteSecret } from '@/api';
import { useRepository } from '@/contexts/RepositoryContext';
import { extractSecretsFromObject, findMissingSecrets } from '../utils/secretsDetector';
import { toast } from 'react-toastify';

export interface SecretManagerState {
  secrets: string[];
  isLoading: boolean;
  error: string | null;
}

export interface SecretManagerActions {
  detectSecretsInConfig: (config: any) => string[];
  createSecret: (name: string, value: string) => Promise<void>;
  deleteSecret: (name: string) => Promise<void>;
  refreshSecrets: () => void;
  validateSecrets: (requiredSecrets: string[]) => {
    missing: string[];
    available: string[];
  };
}

export interface UseSecretManagerReturn
  extends SecretManagerState,
    SecretManagerActions {}

export const useSecretManager = (): UseSecretManagerReturn => {
  const { owner, repo } = useRepository();
  const {
    data: secretsData,
    isLoading,
    error,
    refetch,
  } = useSecrets(owner || '', repo || '');
  const createSecretMutation = useCreateOrUpdateSecret();
  const deleteSecretMutation = useDeleteSecret();

  const [localError, setLocalError] = useState<string | null>(null);

  // 사용 가능한 시크릿 목록
  const secrets = useMemo(() => {
    if (!secretsData?.data?.groupedSecrets) return [];

    const allSecrets: string[] = [];
    Object.values(secretsData.data.groupedSecrets).forEach((group: any) => {
      if (Array.isArray(group)) {
        group.forEach((secret: any) => {
          if (secret.name) allSecrets.push(secret.name);
        });
      }
    });
    return allSecrets;
  }, [secretsData]);

  // Config에서 시크릿 감지
  const detectSecretsInConfig = useCallback((config: any): string[] => {
    if (!config) return [];
    return extractSecretsFromObject(config);
  }, []);

  // 누락된 시크릿 계산
  const getMissingSecrets = useCallback(
    (requiredSecrets: string[]): string[] => {
      return findMissingSecrets(requiredSecrets, secrets);
    },
    [secrets],
  );

  // 시크릿 생성
  const createSecret = useCallback(
    async (name: string, value: string): Promise<void> => {
      if (!owner || !repo) {
        throw new Error('Repository 정보가 필요합니다.');
      }

      setLocalError(null);

      try {
        await createSecretMutation.mutateAsync({
          owner,
          repo,
          secretName: name,
          data: { value },
        });

        toast.success(`시크릿 '${name}'이(가) 성공적으로 생성되었습니다.`);

        // 시크릿 목록 새로고침
        refetch();
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || '시크릿 생성에 실패했습니다.';
        setLocalError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    [owner, repo, createSecretMutation, refetch],
  );

  // 시크릿 검증
  const validateSecrets = useCallback(
    (requiredSecrets: string[]) => {
      const missing = getMissingSecrets(requiredSecrets);
      const available = requiredSecrets.filter((secret) => secrets.includes(secret));

      return { missing, available };
    },
    [secrets, getMissingSecrets],
  );

  // 시크릿 삭제
  const deleteSecret = useCallback(
    async (name: string): Promise<void> => {
      if (!owner || !repo) {
        throw new Error('Repository 정보가 필요합니다.');
      }

      setLocalError(null);

      try {
        await deleteSecretMutation.mutateAsync({
          owner,
          repo,
          secretName: name,
        });

        toast.success(`시크릿 '${name}'이(가) 성공적으로 삭제되었습니다.`);

        // 시크릿 목록 새로고침
        refetch();
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || '시크릿 삭제에 실패했습니다.';
        setLocalError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    [owner, repo, deleteSecretMutation, refetch],
  );

  // 시크릿 새로고침
  const refreshSecrets = useCallback(() => {
    refetch();
  }, [refetch]);

  // 전체 누락된 시크릿을 계산하지 않음 (특정 context에서 계산해야 함)

  return {
    // State
    secrets,
    isLoading:
      isLoading || createSecretMutation.isPending || deleteSecretMutation.isPending,
    error: localError || (error ? '시크릿을 불러오는 중 오류가 발생했습니다.' : null),

    // Actions
    detectSecretsInConfig,
    createSecret,
    deleteSecret,
    refreshSecrets,
    validateSecrets,
  };
};
