// * Lib 모듈 타입 정의

// * API 응답 결과 타입
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error | unknown;
}

// * GitHub 관련 타입
export interface GitHubTokenInfo {
  token: string;
  isValid: boolean;
}

export interface WorkflowParams {
  owner: string;
  repo: string;
  workflowId?: string;
  runId?: string;
  jobId?: string;
  ymlFileName?: string;
  ref?: string;
}

// * 파일 관련 타입
export interface FileInfo {
  name: string;
  extension: string;
  hasExtension: boolean;
}

// * 유틸리티 함수 타입
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, any>;

// * 에러 처리 타입
export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// * 로깅 타입
export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export type LogLevelType = 'debug' | 'info' | 'warn' | 'error';
