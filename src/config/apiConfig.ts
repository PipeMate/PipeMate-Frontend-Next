// * API 설정
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  TIMEOUT: 10000,
} as const;

// * API 경로 상수
const API_PATHS = {
  PIPELINES: '/api/pipelines',
  PRESETS: {
    BLOCKS: '/api/presets/blocks',
    PIPELINES: '/api/presets/pipelines',
  },
  GITHUB: {
    WORKFLOWS: '/api/github/workflows',
    WORKFLOW_RUNS: '/api/github/workflow-runs',
    WORKFLOW_RUN: '/api/github/workflow-run',
    SECRETS: '/api/github/repos/secrets',
  },
} as const;

// * URL 쿼리 파라미터 생성 유틸리티
const createQueryParams = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });
  return searchParams.toString();
};

// * API 엔드포인트 정의
export const API_ENDPOINTS = {
  // * 파이프라인 관련
  PIPELINES: {
    CREATE: API_PATHS.PIPELINES,
    GET: (ymlFileName: string, owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.PIPELINES}/${ymlFileName}?${query}`;
    },
    UPDATE: API_PATHS.PIPELINES,
    DELETE: (ymlFileName: string, owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.PIPELINES}/${ymlFileName}?${query}`;
    },
  },

  // * 프리셋 관련
  PRESETS: {
    BLOCKS: API_PATHS.PRESETS.BLOCKS,
    PIPELINES: API_PATHS.PRESETS.PIPELINES,
  },

  // * GitHub 관련
  GITHUB: {
    WORKFLOWS: (owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.WORKFLOWS}?${query}`;
    },
    WORKFLOW_DETAIL: (workflowId: string, owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.WORKFLOWS}/${workflowId}?${query}`;
    },
    WORKFLOW_RUNS: (owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.WORKFLOW_RUNS}?${query}`;
    },
    WORKFLOW_RUN_DETAIL: (owner: string, repo: string, runId: string) => {
      const query = createQueryParams({ owner, repo, runId });
      return `${API_PATHS.GITHUB.WORKFLOW_RUN}?${query}`;
    },
    WORKFLOW_RUN_LOGS: (owner: string, repo: string, runId: string) => {
      const query = createQueryParams({ owner, repo, runId });
      return `${API_PATHS.GITHUB.WORKFLOW_RUN}/logs/raw?${query}`;
    },
    WORKFLOW_RUN_JOBS: (owner: string, repo: string, runId: string) => {
      const query = createQueryParams({ owner, repo, runId });
      return `${API_PATHS.GITHUB.WORKFLOW_RUN}/jobs?${query}`;
    },
    WORKFLOW_JOB_DETAIL: (owner: string, repo: string, jobId: string) => {
      const query = createQueryParams({ owner, repo, jobId });
      return `${API_PATHS.GITHUB.WORKFLOW_RUN}/job?${query}`;
    },
    WORKFLOW_DISPATCH: (
      owner: string,
      repo: string,
      ymlFileName: string,
      ref: string,
    ) => {
      const query = createQueryParams({ owner, repo, ymlFileName, ref });
      return `${API_PATHS.GITHUB.WORKFLOWS}/dispatch?${query}`;
    },
    WORKFLOW_RUN_CANCEL: (owner: string, repo: string, runId: string) => {
      const query = createQueryParams({ owner, repo, runId });
      return `${API_PATHS.GITHUB.WORKFLOW_RUN}/cancel?${query}`;
    },
    SECRETS: (owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.SECRETS}?${query}`;
    },
    SECRET_CREATE_OR_UPDATE: (owner: string, repo: string, secretName: string) => {
      const query = createQueryParams({ owner, repo, secretName });
      return `${API_PATHS.GITHUB.SECRETS}?${query}`;
    },
    SECRET_DELETE: (owner: string, repo: string, secretName: string) => {
      const query = createQueryParams({ owner, repo, secretName });
      return `${API_PATHS.GITHUB.SECRETS}?${query}`;
    },
  },
} as const;

// * 에러 메시지 정의
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결에 실패했습니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
} as const;

// * HTTP 상태 코드별 에러 메시지 매핑
export const getErrorMessage = (status: number): string => {
  const statusMessages = {
    401: API_ERROR_MESSAGES.UNAUTHORIZED,
    403: API_ERROR_MESSAGES.FORBIDDEN,
    404: API_ERROR_MESSAGES.NOT_FOUND,
    408: API_ERROR_MESSAGES.TIMEOUT,
    500: API_ERROR_MESSAGES.SERVER_ERROR,
    504: API_ERROR_MESSAGES.TIMEOUT,
  } as const;

  return (
    statusMessages[status as keyof typeof statusMessages] || API_ERROR_MESSAGES.UNKNOWN
  );
};
