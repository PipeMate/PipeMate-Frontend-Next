import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowUtils, pipelineUtils } from "@/lib/githubActions";

// * 워크플로우 목록 조회
export const useWorkflows = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["workflows", owner, repo],
    queryFn: () => workflowUtils.getWorkflowsList(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// * 워크플로우 실행 목록 조회
export const useWorkflowRuns = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["workflowRuns", owner, repo],
    queryFn: () => workflowUtils.getWorkflowRuns(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 10 * 1000, // 10초마다 자동 새로고침
  });
};

// * 워크플로우 실행 상세 정보 조회
export const useWorkflowRunDetail = (
  owner: string,
  repo: string,
  runId: string
) => {
  return useQuery({
    queryKey: ["workflowRunDetail", owner, repo, runId],
    queryFn: () => workflowUtils.getWorkflowRunDetail(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    staleTime: 10 * 1000, // 10초
  });
};

// * 워크플로우 실행 로그 조회
export const useWorkflowRunLogs = (
  owner: string,
  repo: string,
  runId: string
) => {
  return useQuery({
    queryKey: ["workflowRunLogs", owner, repo, runId],
    queryFn: () => workflowUtils.getWorkflowRunLogs(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    staleTime: 30 * 1000, // 30초
  });
};

// * 워크플로우 실행의 모든 Job 조회
export const useWorkflowRunJobs = (
  owner: string,
  repo: string,
  runId: string
) => {
  return useQuery({
    queryKey: ["workflowRunJobs", owner, repo, runId],
    queryFn: () => workflowUtils.getWorkflowRunJobs(owner, repo, runId),
    enabled: !!owner && !!repo && !!runId,
    staleTime: 10 * 1000, // 10초
  });
};

// * 파이프라인 조회
export const usePipeline = (
  ymlFileName: string,
  owner: string,
  repo: string
) => {
  return useQuery({
    queryKey: ["pipeline", ymlFileName, owner, repo],
    queryFn: () => pipelineUtils.getPipeline(ymlFileName, owner, repo),
    enabled: !!ymlFileName && !!owner && !!repo,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// * 파이프라인 업데이트 뮤테이션
export const useUpdatePipeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pipelineUtils.updatePipeline,
    onSuccess: (data, variables) => {
      // * 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [
          "pipeline",
          variables.workflowName,
          variables.owner,
          variables.repo,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.owner, variables.repo],
      });
    },
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
    }) => workflowUtils.dispatchWorkflow(owner, repo, ymlFileName, ref),
    onSuccess: (data, variables) => {
      // * 워크플로우 실행 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: ["workflowRuns", variables.owner, variables.repo],
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
    }) => workflowUtils.cancelWorkflowRun(owner, repo, runId),
    onSuccess: (data, variables) => {
      // * 워크플로우 실행 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: ["workflowRuns", variables.owner, variables.repo],
      });
    },
  });
};
