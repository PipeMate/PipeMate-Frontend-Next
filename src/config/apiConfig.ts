//* ========================================
//* API 설정
//* ========================================

//* 실제 API 사용 여부 설정
export const API_CONFIG = {
  //* 실제 백엔드 API 사용 여부
  //* - production 환경에서는 자동으로 true
  //* - development 환경에서는 환경변수로 제어
  USE_REAL_API:
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_USE_REAL_API === 'true',

  //* 백엔드 API 기본 URL
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',

  //* API 타임아웃 (ms)
  TIMEOUT: 10000,

  //* 재시도 횟수
  RETRY_COUNT: 3,

  //* 재시도 간격 (ms)
  RETRY_DELAY: 1000,
};

//* API 엔드포인트 정의
export const API_ENDPOINTS = {
  //* 파이프라인 관련
  PIPELINES: {
    CREATE: '/api/pipelines',
    GET: (ymlFileName: string, owner: string, repo: string) =>
      `/api/pipelines/${ymlFileName}?owner=${owner}&repo=${repo}`,
    UPDATE: '/api/pipelines',
    DELETE: (ymlFileName: string, owner: string, repo: string) =>
      `/api/pipelines/${ymlFileName}?owner=${owner}&repo=${repo}`,
  },

  //* 프리셋 관련
  PRESETS: {
    BLOCKS: '/api/presets/blocks',
    PIPELINES: '/api/presets/pipelines',
  },

  //* GitHub 관련
  GITHUB: {
    WORKFLOWS: (owner: string, repo: string) =>
      `/api/github/workflows?owner=${owner}&repo=${repo}`,
    WORKFLOW_DETAIL: (workflowId: string, owner: string, repo: string) =>
      `/api/github/workflows/${workflowId}?owner=${owner}&repo=${repo}`,
    WORKFLOW_RUNS: (owner: string, repo: string) =>
      `/api/github/workflow-runs?owner=${owner}&repo=${repo}`,
    SECRETS: (owner: string, repo: string) =>
      `/api/github/repos/secrets?owner=${owner}&repo=${repo}`,
  },
};

//* 에러 메시지 정의
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결에 실패했습니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
};

//* HTTP 상태 코드별 에러 메시지 매핑
export const getErrorMessage = (status: number): string => {
  switch (status) {
    case 401:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case 500:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    case 408:
    case 504:
      return API_ERROR_MESSAGES.TIMEOUT;
    default:
      return API_ERROR_MESSAGES.UNKNOWN;
  }
};
