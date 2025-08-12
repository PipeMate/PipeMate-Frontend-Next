/**
 * 워크플로우 관련 React Query 훅 모음
 * - 목록/실행/로그/잡/실행/취소를 제공합니다.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowAPI } from '@/api';

// * 워크플로우 목록 조회
export const useWorkflows = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ['workflows', owner, repo],
    queryFn: () => workflowAPI.getList(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// * 워크플로우 실행 목록 조회
export const useWorkflowRuns = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ['workflowRuns', owner, repo],
    queryFn: () => workflowAPI.getRuns(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 10 * 1000, // 10초마다 자동 새로고침
  });
};

// * 워크플로우 실행 상세 정보 조회
export const useWorkflowRunDetail = (owner: string, repo: string, runId: string) => {
  return useQuery({
    queryKey: ['workflowRunDetail', owner, repo, runId],
    queryFn: () => workflowAPI.getRunDetail(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    staleTime: 10 * 1000, // 10초
  });
};

// * 워크플로우 실행 로그 조회
export const useWorkflowRunLogs = (owner: string, repo: string, runId: string) => {
  return useQuery({
    queryKey: ['workflowRunLogs', owner, repo, runId],
    queryFn: () => workflowAPI.getRunLogs(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    staleTime: 30 * 1000, // 30초
  });
};

// * 워크플로우 실행의 모든 Job 조회
export const useWorkflowRunJobs = (owner: string, repo: string, runId: string) => {
  return useQuery({
    queryKey: ['workflowRunJobs', owner, repo, runId],
    queryFn: () => workflowAPI.getRunJobs(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    staleTime: 10 * 1000, // 10초
  });
};

// * 워크플로우 수동 실행 뮤테이션
export const useDispatchWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      owner,
      repo,
      ymlFileName,
      ref,
    }: {
      owner: string;
      repo: string;
      ymlFileName: string;
      ref: string;
    }) => workflowAPI.dispatch(owner, repo, ymlFileName, ref),
    onSuccess: (data, variables) => {
      // * 워크플로우 실행 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: ['workflowRuns', variables.owner, variables.repo],
      });
    },
  });
};

// * 워크플로우 실행 취소 뮤테이션
export const useCancelWorkflowRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      owner,
      repo,
      runId,
    }: {
      owner: string;
      repo: string;
      runId: string;
    }) => workflowAPI.cancelRun(owner, repo, runId),
    onSuccess: (data, variables) => {
      // * 워크플로우 실행 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: ['workflowRuns', variables.owner, variables.repo],
      });
    },
  });
};
