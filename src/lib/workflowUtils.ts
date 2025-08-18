import { workflowAPI } from '@/api';
import { getCookie } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';
import type { ApiResult } from './types';
import { extractErrorInfo, logger } from './utils';
import { AxiosError } from 'axios';

// * GitHub 토큰 검증 유틸리티
// * - 토큰 존재 여부 확인
// * - 타입 안전한 토큰 정보 반환
const validateGitHubToken = (): { isValid: boolean; token?: string } => {
  const token = getCookie(STORAGES.GITHUB_TOKEN);

  if (!token) {
    logger.warn('GitHub 토큰이 설정되지 않았습니다.');
    return { isValid: false };
  }

  logger.debug('GitHub 토큰 확인됨', { tokenPrefix: token.substring(0, 10) + '...' });
  return { isValid: true, token };
};

// * GitHub Workflow 관리 유틸리티
// * - Workflow CRUD 작업
// * - 타입 안전성 보장
// * - 일관된 에러 처리
export const workflowUtils = {
  // * Workflow 목록 조회
  // * - 저장소의 모든 workflows를 조회합니다.
  getWorkflowsList: async (owner: string, repo: string): Promise<ApiResult> => {
    try {
      logger.info('Workflow 목록 조회 시작', { owner, repo });

      // * GitHub 토큰 검증
      const tokenValidation = validateGitHubToken();
      if (!tokenValidation.isValid) {
        const error = new Error(
          'GitHub Personal Access Token이 설정되지 않았습니다. 설정에서 토큰을 입력해주세요.',
        );
        logger.error('GitHub 토큰 미설정', error);
        return { success: false, error };
      }

      const response = await workflowAPI.getList(owner, repo);
      logger.info('Workflow 목록 조회 성공', { count: response.data?.workflows?.length });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 목록 조회 실패', error, errorInfo);

      // * Axios 에러 상세 정보 로깅
      if (error instanceof AxiosError) {
        logger.error('Axios 에러 상세 정보', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }

      return { success: false, error };
    }
  },

  // * Workflow 상세 정보 조회
  // * - 특정 workflow의 상세 정보를 조회합니다.
  getWorkflowDetail: async (
    workflowId: string,
    owner: string,
    repo: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Workflow 상세 정보 조회 시작', { workflowId, owner, repo });
      const response = await workflowAPI.getDetail(workflowId, owner, repo);
      logger.info('Workflow 상세 정보 조회 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 상세 정보 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Workflow 실행 목록 조회
  // * - 저장소의 workflow 실행 기록을 조회합니다.
  getWorkflowRuns: async (owner: string, repo: string): Promise<ApiResult> => {
    try {
      logger.info('Workflow 실행 목록 조회 시작', { owner, repo });
      const response = await workflowAPI.getRuns(owner, repo);
      logger.info('Workflow 실행 목록 조회 성공', { count: response.data?.length });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 실행 목록 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Workflow 실행 상세 정보 조회
  // * - 특정 workflow 실행의 상세 정보를 조회합니다.
  getWorkflowRunDetail: async (
    owner: string,
    repo: string,
    runId: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Workflow 실행 상세 정보 조회 시작', { runId, owner, repo });
      const response = await workflowAPI.getRunDetail(owner, repo, runId);
      logger.info('Workflow 실행 상세 정보 조회 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 실행 상세 정보 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Workflow 실행 로그 조회
  // * - 특정 workflow 실행의 로그를 조회합니다.
  getWorkflowRunLogs: async (
    owner: string,
    repo: string,
    runId: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Workflow 실행 로그 조회 시작', { runId, owner, repo });
      const response = await workflowAPI.getRunLogs(owner, repo, runId);
      logger.info('Workflow 실행 로그 조회 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 실행 로그 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Workflow 실행의 모든 Job 조회
  // * - 특정 workflow 실행의 모든 job을 조회합니다.
  getWorkflowRunJobs: async (
    owner: string,
    repo: string,
    runId: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Workflow 실행 Job 조회 시작', { runId, owner, repo });
      const response = await workflowAPI.getRunJobs(owner, repo, runId);
      logger.info('Workflow 실행 Job 조회 성공', { count: response.data?.length });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 실행 Job 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * 특정 Job 상세 정보 조회
  // * - 특정 job의 상세 정보를 조회합니다.
  getJobDetail: async (
    owner: string,
    repo: string,
    jobId: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Job 상세 정보 조회 시작', { jobId, owner, repo });
      const response = await workflowAPI.getJobDetail(owner, repo, jobId);
      logger.info('Job 상세 정보 조회 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Job 상세 정보 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Workflow 수동 실행
  // * - 특정 workflow를 수동으로 실행합니다.
  dispatchWorkflow: async (
    owner: string,
    repo: string,
    ymlFileName: string,
    ref: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Workflow 수동 실행 시작', { ymlFileName, ref, owner, repo });
      const response = await workflowAPI.dispatch(owner, repo, ymlFileName, ref);
      logger.info('Workflow 수동 실행 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 수동 실행 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Workflow 실행 취소
  // * - 실행 중인 workflow를 취소합니다.
  cancelWorkflowRun: async (
    owner: string,
    repo: string,
    runId: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Workflow 실행 취소 시작', { runId, owner, repo });
      const response = await workflowAPI.cancelRun(owner, repo, runId);
      logger.info('Workflow 실행 취소 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Workflow 실행 취소 실패', error, errorInfo);
      return { success: false, error };
    }
  },
};
