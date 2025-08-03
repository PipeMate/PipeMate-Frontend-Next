import githubClient from "@/api/githubClient";
import { WorkflowItem, GithubJobDetailResponse } from "@/api/types";

// * GitHub Workflow 관리 API
export const workflowAPI = {
  // * 3.1 Workflow 목록 조회
  getList: (owner: string, repo: string) =>
    githubClient.get<{ workflows: WorkflowItem[] }>("/api/github/workflows", {
      params: { owner, repo },
    }),

  // * 3.2 Workflow 상세 정보 조회
  getDetail: (workflowId: string, owner: string, repo: string) =>
    githubClient.get<WorkflowItem>(`/api/github/workflows/${workflowId}`, {
      params: { owner, repo },
    }),

  // * 3.3 Workflow 실행 목록 조회
  getRuns: (owner: string, repo: string) =>
    githubClient.get("/api/github/workflow-runs", {
      params: { owner, repo },
    }),

  // * 3.4 Workflow 실행 상세 정보 조회
  getRunDetail: (owner: string, repo: string, runId: string) =>
    githubClient.get("/api/github/workflow-run", {
      params: { owner, repo, runId },
    }),

  // * 3.5 Workflow 실행 로그 조회
  getRunLogs: (owner: string, repo: string, runId: string) =>
    githubClient.get<string>("/api/github/workflow-run/logs/raw", {
      params: { owner, repo, runId },
    }),

  // * 3.6 Workflow 실행의 모든 Job 조회
  getRunJobs: (owner: string, repo: string, runId: string) =>
    githubClient.get<GithubJobDetailResponse[]>(
      "/api/github/workflow-run/jobs",
      {
        params: { owner, repo, runId },
      }
    ),

  // * 3.7 특정 Job 상세 정보 조회
  getJobDetail: (owner: string, repo: string, jobId: string) =>
    githubClient.get<GithubJobDetailResponse>("/api/github/workflow-run/job", {
      params: { owner, repo, jobId },
    }),

  // * 3.8 Workflow 수동 실행
  dispatch: (owner: string, repo: string, ymlFileName: string, ref: string) =>
    githubClient.post<string>("/api/github/workflows/dispatch", null, {
      params: { owner, repo, ymlFileName, ref },
    }),

  // * 3.9 Workflow 실행 취소
  cancelRun: (owner: string, repo: string, runId: string) =>
    githubClient.post<string>("/api/github/workflow-run/cancel", null, {
      params: { owner, repo, runId },
    }),
};
