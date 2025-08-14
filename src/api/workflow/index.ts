// * GitHub Workflow 관리 API
// * - 목록/상세/실행/취소/로그/잡 조회 등 GitHub 워크플로우 관련 기능 제공
import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import { WorkflowItem, GithubJobDetailResponse } from '@/api/types';

export const workflowAPI = {
  // * 3.1 Workflow 목록 조회
  // * 워크플로우 목록을 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  getList: (owner: string, repo: string) =>
    githubClient.get<{ workflows: WorkflowItem[] }>(
      API_ENDPOINTS.GITHUB.WORKFLOWS(owner, repo),
    ),

  // * 3.2 Workflow 상세 정보 조회
  // * 특정 워크플로우의 상세 정보를 조회합니다.
  // * @param workflowId 워크플로우 ID
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  getDetail: (workflowId: string, owner: string, repo: string) =>
    githubClient.get<WorkflowItem>(
      API_ENDPOINTS.GITHUB.WORKFLOW_DETAIL(workflowId, owner, repo),
    ),

  // * 3.3 Workflow 실행 목록 조회
  // * 워크플로우 실행 목록을 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  getRuns: (owner: string, repo: string) =>
    githubClient.get(API_ENDPOINTS.GITHUB.WORKFLOW_RUNS(owner, repo)),

  // * 3.4 Workflow 실행 상세 정보 조회
  // * 특정 워크플로우 실행의 상세 정보를 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param runId 실행 ID
  getRunDetail: (owner: string, repo: string, runId: string) =>
    githubClient.get(API_ENDPOINTS.GITHUB.WORKFLOW_RUN_DETAIL(owner, repo, runId)),

  // * 3.5 Workflow 실행 로그 조회
  // * 워크플로우 실행 로그를 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param runId 실행 ID
  getRunLogs: (owner: string, repo: string, runId: string) =>
    githubClient.get<string>(API_ENDPOINTS.GITHUB.WORKFLOW_RUN_LOGS(owner, repo, runId)),

  // * 3.6 Workflow 실행의 모든 Job 조회
  // * 워크플로우 실행의 모든 Job을 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param runId 실행 ID
  getRunJobs: (owner: string, repo: string, runId: string) =>
    githubClient.get<GithubJobDetailResponse[]>(
      API_ENDPOINTS.GITHUB.WORKFLOW_RUN_JOBS(owner, repo, runId),
    ),

  // * 3.7 특정 Job 상세 정보 조회
  // * 특정 Job의 상세 정보를 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param jobId Job ID
  getJobDetail: (owner: string, repo: string, jobId: string) =>
    githubClient.get<GithubJobDetailResponse>(
      API_ENDPOINTS.GITHUB.WORKFLOW_JOB_DETAIL(owner, repo, jobId),
    ),

  // * 3.8 Workflow 수동 실행
  // * 워크플로우를 수동으로 실행합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param ymlFileName YAML 파일명
  // * @param ref 브랜치/태그/커밋
  dispatch: (owner: string, repo: string, ymlFileName: string, ref: string) =>
    githubClient.post<string>(
      API_ENDPOINTS.GITHUB.WORKFLOW_DISPATCH(owner, repo, ymlFileName, ref),
    ),

  // * 3.9 Workflow 실행 취소
  // * 워크플로우 실행을 취소합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param runId 실행 ID
  cancelRun: (owner: string, repo: string, runId: string) =>
    githubClient.post<string>(
      API_ENDPOINTS.GITHUB.WORKFLOW_RUN_CANCEL(owner, repo, runId),
    ),
};
