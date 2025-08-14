import { secretsAPI, GithubSecretRequest } from '@/api';
import type { ApiResult } from './types';
import { logger, extractErrorInfo } from './utils';

// * GitHub Secrets 관리 유틸리티
// * - Secrets CRUD 작업
// * - 타입 안전성 보장
// * - 일관된 에러 처리
export const secretsUtils = {
  // * Secrets 목록 조회
  // * - 저장소의 모든 secrets를 조회합니다.
  getSecretsList: async (owner: string, repo: string): Promise<ApiResult> => {
    try {
      logger.info('Secrets 목록 조회 시작', { owner, repo });
      const response = await secretsAPI.getList(owner, repo);
      logger.info('Secrets 목록 조회 성공', { count: response.data?.secrets?.length });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Secrets 목록 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Secret 생성/수정
  // * - 새로운 secret을 생성하거나 기존 secret을 업데이트합니다.
  createOrUpdateSecret: async (
    owner: string,
    repo: string,
    secretName: string,
    value: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Secret 생성/수정 시작', { owner, repo, secretName });
      const data: GithubSecretRequest = { value };
      await secretsAPI.createOrUpdate(owner, repo, secretName, data);
      logger.info('Secret 생성/수정 성공', { secretName });
      return { success: true };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Secret 생성/수정 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * 퍼블릭 키 조회
  // * - 저장소의 퍼블릭 키를 조회합니다.
  getPublicKey: async (owner: string, repo: string): Promise<ApiResult> => {
    try {
      logger.info('퍼블릭 키 조회 시작', { owner, repo });
      const response = await secretsAPI.getPublicKey(owner, repo);
      logger.info('퍼블릭 키 조회 성공');
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('퍼블릭 키 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * Secret 삭제
  // * - 특정 secret을 삭제합니다.
  deleteSecret: async (
    owner: string,
    repo: string,
    secretName: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('Secret 삭제 시작', { owner, repo, secretName });
      await secretsAPI.delete(owner, repo, secretName);
      logger.info('Secret 삭제 성공', { secretName });
      return { success: true };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('Secret 삭제 실패', error, errorInfo);
      return { success: false, error };
    }
  },
};
