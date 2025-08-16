// * Secrets 관련 React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { secretsAPI } from './api';
import { GithubSecretRequest } from './types';

// * Secrets 목록 조회 (도메인별 그룹화됨)
export const useSecrets = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ['secrets', owner, repo],
    queryFn: () => secretsAPI.getList(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 30 * 1000, // 30초로 단축 (시크릿 변경사항 빠르게 반영)
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
  });
};

// * Secret 생성/수정 뮤테이션
export const useCreateOrUpdateSecret = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      owner,
      repo,
      secretName,
      data,
    }: {
      owner: string;
      repo: string;
      secretName: string;
      data: GithubSecretRequest;
    }) => secretsAPI.createOrUpdate(owner, repo, secretName, data),
    onSuccess: (data, variables) => {
      // * 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['secrets', variables.owner, variables.repo],
      });
    },
  });
};

// * Secret 삭제 뮤테이션
export const useDeleteSecret = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      owner,
      repo,
      secretName,
    }: {
      owner: string;
      repo: string;
      secretName: string;
    }) => secretsAPI.delete(owner, repo, secretName),
    onSuccess: (data, variables) => {
      // * 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['secrets', variables.owner, variables.repo],
      });
    },
  });
};
