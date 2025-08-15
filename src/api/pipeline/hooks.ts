// * Pipeline 관련 React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineAPI } from './api';

// * 파이프라인 조회
export const usePipeline = (ymlFileName: string, owner: string, repo: string) => {
  return useQuery({
    queryKey: ['pipeline', ymlFileName, owner, repo],
    queryFn: () => pipelineAPI.get(ymlFileName, owner, repo),
    enabled: !!ymlFileName && !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// * 파이프라인 생성 뮤테이션
export const useCreatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pipelineAPI.create,
    onSuccess: (data, variables) => {
      // * 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.owner, variables.repo],
      });
    },
  });
};

// * 파이프라인 업데이트 뮤테이션
export const useUpdatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pipelineAPI.update,
    onSuccess: (data, variables) => {
      // * 캐시된 파이프라인 데이터 무효화
      queryClient.invalidateQueries({
        queryKey: ['pipeline', variables.workflowName, variables.owner, variables.repo],
      });
      // * 워크플로우 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.owner, variables.repo],
      });
    },
  });
};

// * 파이프라인 삭제 뮤테이션
export const useDeletePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ymlFileName,
      owner,
      repo,
    }: {
      ymlFileName: string;
      owner: string;
      repo: string;
    }) => pipelineAPI.delete(ymlFileName, owner, repo),
    onSuccess: (data, variables) => {
      // * 캐시된 파이프라인 데이터 무효화
      queryClient.invalidateQueries({
        queryKey: ['pipeline', variables.ymlFileName, variables.owner, variables.repo],
      });
      // * 워크플로우 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.owner, variables.repo],
      });
    },
  });
};

// * 워크플로우 저장 뮤테이션 (ServerBlock 배열을 받아서 저장)
export const useSaveWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pipelineAPI.saveWorkflow,
    onSuccess: (data, variables) => {
      // * 워크플로우 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.owner, variables.repo],
      });
    },
  });
};
