import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { secretsAPI } from "@/api/githubClient";

// * Secrets 목록 조회
export const useSecrets = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["secrets", owner, repo],
    queryFn: () => secretsAPI.getList(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// * Secrets 그룹화된 목록 조회
export const useGroupedSecrets = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["groupedSecrets", owner, repo],
    queryFn: () => secretsAPI.getGroupedList(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// * Public Key 조회
export const usePublicKey = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["publicKey", owner, repo],
    queryFn: () => secretsAPI.getPublicKey(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 10 * 60 * 1000, // 10분
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
      data: any;
    }) => secretsAPI.createOrUpdate(owner, repo, secretName, data),
    onSuccess: (data, variables) => {
      // * 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["secrets", variables.owner, variables.repo],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupedSecrets", variables.owner, variables.repo],
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
        queryKey: ["secrets", variables.owner, variables.repo],
      });
      queryClient.invalidateQueries({
        queryKey: ["groupedSecrets", variables.owner, variables.repo],
      });
    },
  });
};
