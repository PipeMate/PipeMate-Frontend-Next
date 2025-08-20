// * GitHub Workflow 관리 API
// * - 목록/상세/실행/취소/로그/잡 조회 등 GitHub 워크플로우 관련 기능 제공
import githubClient from '../githubClient';
import { API_ENDPOINTS } from '@/config';
import type { GithubJobDetailResponse, WorkflowItem } from './types';

export const workflowAPI = {
  // * Workflow 목록 조회
  getList: (owner: string, repo: string) =>
    githubClient.get<{ workflows: WorkflowItem[] }>(
      API_ENDPOINTS.GITHUB.WORKFLOWS(owner, repo),
    ),

  // * Workflow 상세 정보 조회
  getDetail: (workflowId: string, owner: string, repo: string) =>
    githubClient.get<WorkflowItem>(
      API_ENDPOINTS.GITHUB.WORKFLOW_DETAIL(workflowId, owner, repo),
    ),

  // * Workflow 실행 목록 조회
  getRuns: (owner: string, repo: string) =>
    githubClient.get(API_ENDPOINTS.GITHUB.WORKFLOW_RUNS(owner, repo)),

  // * Workflow 실행 상세 정보 조회
  getRunDetail: (owner: string, repo: string, runId: string) =>
    githubClient.get(API_ENDPOINTS.GITHUB.WORKFLOW_RUN_DETAIL(owner, repo, runId)),

  // * Workflow 실행 로그 조회
  getRunLogs: (owner: string, repo: string, runId: string) =>
    githubClient.get<string>(API_ENDPOINTS.GITHUB.WORKFLOW_RUN_LOGS(owner, repo, runId)),

  // * Workflow 실행 Job 목록 조회
  getRunJobs: (owner: string, repo: string, runId: string) =>
    githubClient.get<GithubJobDetailResponse[]>(
      API_ENDPOINTS.GITHUB.WORKFLOW_RUN_JOBS(owner, repo, runId),
    ),

  // * Job 상세 정보 조회
  getJobDetail: (owner: string, repo: string, jobId: string) =>
    githubClient.get<GithubJobDetailResponse>(
      API_ENDPOINTS.GITHUB.WORKFLOW_JOB_DETAIL(owner, repo, jobId),
    ),

  // * Workflow 수동 실행
  dispatch: (owner: string, repo: string, ymlFileName: string, ref: string) =>
    githubClient.post<string>(
      API_ENDPOINTS.GITHUB.WORKFLOW_DISPATCH(owner, repo, ymlFileName, ref),
    ),

  // * Workflow 실행 취소
  cancelRun: (owner: string, repo: string, runId: string) =>
    githubClient.post<string>(
      API_ENDPOINTS.GITHUB.WORKFLOW_RUN_CANCEL(owner, repo, runId),
    ),
};
