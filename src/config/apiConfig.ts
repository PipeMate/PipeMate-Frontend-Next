import type { ApiConfig, ApiEndpoints, ApiErrorMessages, HttpStatusCode } from './types';

// * 환경 변수 상수
const ENV_VARS = {
  NODE_ENV: process.env.NODE_ENV,
  USE_REAL_API: process.env.NEXT_PUBLIC_USE_REAL_API,
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
} as const;

// * API 기본 설정 상수
const API_DEFAULTS = {
  BASE_URL: 'http://localhost:8080',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
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

// * API 설정
// * - 환경별 설정 관리
// * - 타입 안전성 보장
export const API_CONFIG: ApiConfig = {
  // 실제 백엔드 API 사용 여부
  // - production 환경에서는 자동으로 true
  // - development 환경에서는 환경변수로 제어
  // - 임시로 강제 활성화 (디버깅용)
  USE_REAL_API: true, // ENV_VARS.NODE_ENV === 'production' || ENV_VARS.USE_REAL_API === 'true',

  // 백엔드 API 기본 URL
  BASE_URL: ENV_VARS.API_BASE_URL || API_DEFAULTS.BASE_URL,

  // API 타임아웃 (ms)
  TIMEOUT: API_DEFAULTS.TIMEOUT,

  // 재시도 횟수
  RETRY_COUNT: API_DEFAULTS.RETRY_COUNT,

  // 재시도 간격 (ms)
  RETRY_DELAY: API_DEFAULTS.RETRY_DELAY,
};

// * URL 쿼리 파라미터 생성 유틸리티
const createQueryParams = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });
  return searchParams.toString();
};

// * API 엔드포인트 정의
// * - 타입 안전한 URL 생성
// * - 쿼리 파라미터 자동 처리
export const API_ENDPOINTS: ApiEndpoints = {
  // 파이프라인 관련
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

  // 프리셋 관련
  PRESETS: {
    BLOCKS: API_PATHS.PRESETS.BLOCKS,
    PIPELINES: API_PATHS.PRESETS.PIPELINES,
  },

  // GitHub 관련
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
      return `${API_PATHS.GITHUB.WORKFLOW_RUN}/?${query}`;
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
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.WORKFLOW_RUNS}/jobs/${jobId}?${query}`;
    },
    WORKFLOW_DISPATCH: (
      owner: string,
      repo: string,
      ymlFileName: string,
      ref: string,
    ) => {
      const query = createQueryParams({ owner, repo, ref });
      return `${API_PATHS.GITHUB.WORKFLOWS}/${ymlFileName}/dispatches?${query}`;
    },
    WORKFLOW_RUN_CANCEL: (owner: string, repo: string, runId: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.WORKFLOW_RUNS}/${runId}/cancel?${query}`;
    },
    SECRETS: (owner: string, repo: string) => {
      const query = createQueryParams({ owner, repo });
      return `${API_PATHS.GITHUB.SECRETS}?${query}`;
    },
    SECRET_CREATE_OR_UPDATE: (_owner: string, _repo: string, secretName: string) => {
      return `${API_PATHS.GITHUB.SECRETS}/${secretName}`;
    },
    SECRET_PUBLIC_KEY: (_owner: string, _repo: string) => {
      return `${API_PATHS.GITHUB.SECRETS}/public-key`;
    },
    SECRET_DELETE: (_owner: string, _repo: string, secretName: string) => {
      return `${API_PATHS.GITHUB.SECRETS}/${secretName}`;
    },
  },
};

// * 에러 메시지 정의
// * - 사용자 친화적인 메시지
// * - 일관된 메시지 형식
export const API_ERROR_MESSAGES: ApiErrorMessages = {
  NETWORK_ERROR: '네트워크 연결에 실패했습니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
};

// * HTTP 상태 코드별 에러 메시지 매핑
// * - 타입 안전한 상태 코드 처리
// * - 명확한 에러 메시지 반환
export const getErrorMessage = (status: number): string => {
  const statusMessages: Record<HttpStatusCode, string> = {
    401: API_ERROR_MESSAGES.UNAUTHORIZED,
    403: API_ERROR_MESSAGES.FORBIDDEN,
    404: API_ERROR_MESSAGES.NOT_FOUND,
    408: API_ERROR_MESSAGES.TIMEOUT,
    500: API_ERROR_MESSAGES.SERVER_ERROR,
    504: API_ERROR_MESSAGES.TIMEOUT,
  };

  return statusMessages[status as HttpStatusCode] || API_ERROR_MESSAGES.UNKNOWN;
};
