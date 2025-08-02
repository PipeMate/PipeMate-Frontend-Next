import apiClient from "@/api";
import { STORAGES } from "@/config/appConstants";
import { getCookie } from "@/lib/cookieUtils";

// * GitHub 전용 클라이언트 (GitHub Personal Access Token 포함)
// ? apiClient 인스턴스 기본 설정 상속
const githubClient = apiClient.create();

// * 토큰 인터셉터
githubClient.interceptors.request.use(
  (config) => {
    // * 쿠키에서 GitHub Personal Access Token 가져오기
    const savedGithubToken = getCookie(STORAGES.GITHUB_TOKEN);
    if (savedGithubToken) {
      // * GitHub API는 Bearer 토큰 형식을 요구합니다
      config.headers.Authorization = `Bearer ${savedGithubToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// * 타입 정의
export interface PipelineRequest {
  owner: string;
  repo: string;
  workflowName: string;
  inputJson: Record<string, unknown>[];
  description?: string;
}

export interface PipelineResponse {
  workflowId: string;
  owner: string;
  repo: string;
  workflowName: string;
  originalJson: Record<string, unknown>[];
  convertedJson: Record<string, unknown>;
  yamlContent: string;
  githubPath: string;
  createdAt: string;
  updatedAt: string;
  success: boolean;
  message: string;
}

export interface WorkflowItem {
  id: number;
  name: string;
  path: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  htmlUrl: string;
  badgeUrl: string;
  manualDispatchEnabled: boolean;
  availableBranches: string[];
  fileName: string;
}

export interface GithubJobDetailResponse {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  steps: {
    name: string;
    status: string;
    conclusion: string;
    startedAt: string;
    completedAt: string;
  }[];
}

export interface GithubSecretRequest {
  value: string;
}

export interface GithubPublicKeyResponse {
  key: string;
  keyId: string;
}

export interface GithubSecretListResponse {
  totalCount: number;
  secrets: {
    name: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

// * 1. 파이프라인 관리 API
export const pipelineAPI = {
  // * 1.1 파이프라인 생성
  create: (data: PipelineRequest) =>
    githubClient.post<string>("/api/pipelines", data),

  // * 1.2 파이프라인 조회
  get: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.get<PipelineResponse>(`/api/pipelines/${ymlFileName}`, {
      params: { owner, repo },
    }),

  // * 1.3 파이프라인 업데이트
  update: (data: PipelineRequest) =>
    githubClient.put<PipelineResponse>("/api/pipelines", data),

  // * 1.4 파이프라인 삭제
  delete: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.delete(`/api/pipelines/${ymlFileName}`, {
      params: { owner, repo },
    }),
};

// * 2. GitHub Secrets 관리 API
export const secretsAPI = {
  // * 2.1 Secrets 목록 조회
  getList: (owner: string, repo: string) =>
    githubClient.get<GithubSecretListResponse>("/api/github/repos/secrets", {
      params: { owner, repo },
    }),

  // * 2.2 Secret 생성/수정
  createOrUpdate: (
    owner: string,
    repo: string,
    secretName: string,
    data: GithubSecretRequest
  ) =>
    githubClient.put(`/api/github/repos/secrets`, data, {
      params: { owner, repo, secretName },
    }),

  // * 2.3 퍼블릭 키 조회
  getPublicKey: (owner: string, repo: string) =>
    githubClient.get<GithubPublicKeyResponse>(
      "/api/github/repos/secrets/public-key",
      {
        params: { owner, repo },
      }
    ),

  // * 2.4 Secret 삭제
  delete: (owner: string, repo: string, secretName: string) =>
    githubClient.delete("/api/github/repos/secrets", {
      params: { owner, repo, secretName },
    }),
};

// * 3. GitHub Workflow 관리 API
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

export default githubClient;
