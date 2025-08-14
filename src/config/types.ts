// * Config 모듈 타입 정의

// * API 설정 관련 타입
export interface ApiConfig {
  USE_REAL_API: boolean;
  BASE_URL: string;
  TIMEOUT: number;
  RETRY_COUNT: number;
  RETRY_DELAY: number;
}

// * API 엔드포인트 함수 타입
export interface EndpointFunction {
  (owner: string, repo: string): string;
}

export interface WorkflowDetailEndpointFunction {
  (workflowId: string, owner: string, repo: string): string;
}

export interface SecretEndpointFunction {
  (owner: string, repo: string, secretName: string): string;
}

export interface WorkflowDispatchEndpointFunction {
  (owner: string, repo: string, ymlFileName: string, ref: string): string;
}

export interface PipelineEndpointFunction {
  (ymlFileName: string, owner: string, repo: string): string;
}

// * API 엔드포인트 구조 타입
export interface ApiEndpoints {
  PIPELINES: {
    CREATE: string;
    GET: PipelineEndpointFunction;
    UPDATE: string;
    DELETE: PipelineEndpointFunction;
  };
  PRESETS: {
    BLOCKS: string;
    PIPELINES: string;
  };
  GITHUB: {
    WORKFLOWS: EndpointFunction;
    WORKFLOW_DETAIL: WorkflowDetailEndpointFunction;
    WORKFLOW_RUNS: EndpointFunction;
    WORKFLOW_RUN_DETAIL: WorkflowDetailEndpointFunction;
    WORKFLOW_RUN_LOGS: WorkflowDetailEndpointFunction;
    WORKFLOW_RUN_JOBS: WorkflowDetailEndpointFunction;
    WORKFLOW_JOB_DETAIL: WorkflowDetailEndpointFunction;
    WORKFLOW_DISPATCH: WorkflowDispatchEndpointFunction;
    WORKFLOW_RUN_CANCEL: WorkflowDetailEndpointFunction;
    SECRETS: EndpointFunction;
    SECRET_CREATE_OR_UPDATE: SecretEndpointFunction;
    SECRET_PUBLIC_KEY: EndpointFunction;
    SECRET_DELETE: SecretEndpointFunction;
  };
}

// * 에러 메시지 타입
export interface ApiErrorMessages {
  NETWORK_ERROR: string;
  UNAUTHORIZED: string;
  FORBIDDEN: string;
  NOT_FOUND: string;
  SERVER_ERROR: string;
  TIMEOUT: string;
  UNKNOWN: string;
}

// * HTTP 상태 코드 타입
export type HttpStatusCode = 401 | 403 | 404 | 408 | 500 | 504;
