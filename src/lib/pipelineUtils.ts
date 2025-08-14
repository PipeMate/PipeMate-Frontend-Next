import { pipelineAPI, PipelineRequest } from '@/api';
import type { ApiResult } from './types';
import { logger, extractErrorInfo } from './utils';

// * 파이프라인 관리 유틸리티
// * - 파이프라인 CRUD 작업
// * - 타입 안전성 보장
// * - 일관된 에러 처리
export const pipelineUtils = {
  // * 파이프라인 생성
  // * - 새로운 파이프라인을 생성합니다.
  createPipeline: async (data: PipelineRequest): Promise<ApiResult> => {
    try {
      logger.info('파이프라인 생성 시작', { data });
      const response = await pipelineAPI.create(data);
      logger.info('파이프라인 생성 성공', { response: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('파이프라인 생성 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * 파이프라인 조회
  // * - 특정 파이프라인을 조회합니다.
  getPipeline: async (
    ymlFileName: string,
    owner: string,
    repo: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('파이프라인 조회 시작', { ymlFileName, owner, repo });
      const response = await pipelineAPI.get(ymlFileName, owner, repo);
      logger.info('파이프라인 조회 성공', { response: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('파이프라인 조회 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * 파이프라인 업데이트
  // * - 기존 파이프라인을 업데이트합니다.
  updatePipeline: async (data: PipelineRequest): Promise<ApiResult> => {
    try {
      logger.info('파이프라인 업데이트 시작', { data });
      const response = await pipelineAPI.update(data);
      logger.info('파이프라인 업데이트 성공', { response: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('파이프라인 업데이트 실패', error, errorInfo);
      return { success: false, error };
    }
  },

  // * 파이프라인 삭제
  // * - 특정 파이프라인을 삭제합니다.
  deletePipeline: async (
    ymlFileName: string,
    owner: string,
    repo: string,
  ): Promise<ApiResult> => {
    try {
      logger.info('파이프라인 삭제 시작', { ymlFileName, owner, repo });
      await pipelineAPI.delete(ymlFileName, owner, repo);
      logger.info('파이프라인 삭제 성공');
      return { success: true };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error('파이프라인 삭제 실패', error, errorInfo);
      return { success: false, error };
    }
  },
};
