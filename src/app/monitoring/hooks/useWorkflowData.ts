import { useMemo } from 'react';
import {
  useWorkflowRuns,
  useWorkflowRunJobs,
  useWorkflowRunLogs,
  useWorkflowRunDetail,
} from '@/api';
import type { WorkflowRun } from '../types';

const ITEMS_PER_PAGE = 10;

export interface WorkflowDataState {
  workflowRuns: WorkflowRun[];
  runningWorkflows: WorkflowRun[];
  completedWorkflows: WorkflowRun[];
  displayedCompletedRuns: WorkflowRun[];
  totalPages: number;
  runsLoading: boolean;
  runsError: unknown;
  jobsLoading: boolean;
  logsLoading: boolean;
  runJobsData: unknown;
  runLogsData: unknown;
  refetchRuns: () => void;
}

export interface UseWorkflowDataParams {
  owner: string;
  repo: string;
  isConfigured: boolean;
  autoRefresh: boolean;
  selectedRunId: number | null;
  currentPage: number;
}

// 실제 API 응답 타입 (snake_case)
interface WorkflowRunsApiResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

export function useWorkflowData({
  owner,
  repo,
  isConfigured,
  autoRefresh,
  selectedRunId,
  currentPage,
}: UseWorkflowDataParams): WorkflowDataState {
  // API 훅 사용
  const {
    data: workflowRunsData,
    isLoading: runsLoading,
    refetch: refetchRuns,
    error: runsError,
  } = useWorkflowRuns(owner || '', repo || '', {
    refetchInterval: autoRefresh ? 10 * 1000 : false,
    refetchOnWindowFocus: false,
    enabled: isConfigured && !!owner && !!repo,
  });

  const runId = selectedRunId ? String(selectedRunId) : '';
  const { data: runJobsData, isLoading: jobsLoading } = useWorkflowRunJobs(
    owner || '',
    repo || '',
    runId,
  );
  const { data: runLogsData, isLoading: logsLoading } = useWorkflowRunLogs(
    owner || '',
    repo || '',
    runId,
  );
  const { data: _runDetailData } = useWorkflowRunDetail(owner || '', repo || '', runId);

  // 데이터 파싱 및 처리
  const processedData = useMemo(() => {
    const runsResponse = workflowRunsData as WorkflowRunsApiResponse | undefined;

    const workflowRuns: WorkflowRun[] = Array.isArray(runsResponse?.workflow_runs)
      ? runsResponse!.workflow_runs
      : [];

    // 워크플로우 분류 (실행 중 / 완료)
    const runningWorkflows = workflowRuns.filter((run) => run.status === 'in_progress');
    const completedWorkflows = workflowRuns.filter((run) => run.status !== 'in_progress');

    // 페이지네이션된 완료된 실행 목록
    const displayedCompletedRuns = completedWorkflows.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );

    const totalPages = Math.ceil(completedWorkflows.length / ITEMS_PER_PAGE);

    return {
      workflowRuns,
      runningWorkflows,
      completedWorkflows,
      displayedCompletedRuns,
      totalPages,
    };
  }, [workflowRunsData, currentPage]);

  return {
    ...processedData,
    runsLoading,
    runsError,
    jobsLoading,
    logsLoading,
    runJobsData,
    runLogsData,
    refetchRuns,
  };
}
