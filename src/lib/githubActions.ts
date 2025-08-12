import {
  pipelineAPI,
  secretsAPI,
  workflowAPI,
  PipelineRequest,
  GithubSecretRequest,
} from '@/api';
import { AxiosError } from 'axios';
import { getCookie } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';

// * 파이프라인 관리 유틸리티
export const pipelineUtils = {
  // * 파이프라인 생성
  createPipeline: async (data: PipelineRequest) => {
    try {
      const response = await pipelineAPI.create(data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('파이프라인 생성 실패:', error);
      return { success: false, error };
    }
  },

  // * 파이프라인 조회
  getPipeline: async (ymlFileName: string, owner: string, repo: string) => {
    try {
      const response = await pipelineAPI.get(ymlFileName, owner, repo);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('파이프라인 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * 파이프라인 업데이트
  updatePipeline: async (data: PipelineRequest) => {
    try {
      const response = await pipelineAPI.update(data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('파이프라인 업데이트 실패:', error);
      return { success: false, error };
    }
  },

  // * 파이프라인 삭제
  deletePipeline: async (ymlFileName: string, owner: string, repo: string) => {
    try {
      await pipelineAPI.delete(ymlFileName, owner, repo);
      return { success: true };
    } catch (error) {
      console.error('파이프라인 삭제 실패:', error);
      return { success: false, error };
    }
  },
};

// * GitHub Secrets 관리 유틸리티
export const secretsUtils = {
  // * Secrets 목록 조회
  getSecretsList: async (owner: string, repo: string) => {
    try {
      const response = await secretsAPI.getList(owner, repo);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Secrets 목록 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Secret 생성/수정
  createOrUpdateSecret: async (
    owner: string,
    repo: string,
    secretName: string,
    value: string,
  ) => {
    try {
      const data: GithubSecretRequest = { value };
      await secretsAPI.createOrUpdate(owner, repo, secretName, data);
      return { success: true };
    } catch (error) {
      console.error('Secret 생성/수정 실패:', error);
      return { success: false, error };
    }
  },

  // * 퍼블릭 키 조회
  getPublicKey: async (owner: string, repo: string) => {
    try {
      const response = await secretsAPI.getPublicKey(owner, repo);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('퍼블릭 키 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Secret 삭제
  deleteSecret: async (owner: string, repo: string, secretName: string) => {
    try {
      await secretsAPI.delete(owner, repo, secretName);
      return { success: true };
    } catch (error) {
      console.error('Secret 삭제 실패:', error);
      return { success: false, error };
    }
  },
};

// * GitHub Workflow 관리 유틸리티
export const workflowUtils = {
  // * Workflow 목록 조회
  getWorkflowsList: async (owner: string, repo: string) => {
    try {
      console.log('API 호출 시작:', { owner, repo });

      // * GitHub 토큰 확인
      const savedGithubToken = getCookie(STORAGES.GITHUB_TOKEN);
      if (!savedGithubToken) {
        console.error('GitHub 토큰이 설정되지 않았습니다.');
        return {
          success: false,
          error: new Error(
            'GitHub Personal Access Token이 설정되지 않았습니다. 설정에서 토큰을 입력해주세요.',
          ),
        };
      }

      console.log('GitHub 토큰 확인됨:', savedGithubToken.substring(0, 10) + '...');

      const response = await workflowAPI.getList(owner, repo);
      console.log('API 응답 성공:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 목록 조회 실패:', error);
      console.error('오류 상세 정보:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof AxiosError ? error.code : undefined,
        response: error instanceof AxiosError ? error.response?.data : undefined,
        status: error instanceof AxiosError ? error.response?.status : undefined,
        headers: error instanceof AxiosError ? error.response?.headers : undefined,
      });

      return { success: false, error };
    }
  },

  // * Workflow 상세 정보 조회
  getWorkflowDetail: async (workflowId: string, owner: string, repo: string) => {
    try {
      const response = await workflowAPI.getDetail(workflowId, owner, repo);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 상세 정보 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Workflow 실행 목록 조회
  getWorkflowRuns: async (owner: string, repo: string) => {
    try {
      const response = await workflowAPI.getRuns(owner, repo);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 실행 목록 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Workflow 실행 상세 정보 조회
  getWorkflowRunDetail: async (owner: string, repo: string, runId: string) => {
    try {
      const response = await workflowAPI.getRunDetail(owner, repo, runId);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 실행 상세 정보 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Workflow 실행 로그 조회
  getWorkflowRunLogs: async (owner: string, repo: string, runId: string) => {
    try {
      const response = await workflowAPI.getRunLogs(owner, repo, runId);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 실행 로그 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Workflow 실행의 모든 Job 조회
  getWorkflowRunJobs: async (owner: string, repo: string, runId: string) => {
    try {
      const response = await workflowAPI.getRunJobs(owner, repo, runId);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 실행 Job 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * 특정 Job 상세 정보 조회
  getJobDetail: async (owner: string, repo: string, jobId: string) => {
    try {
      const response = await workflowAPI.getJobDetail(owner, repo, jobId);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Job 상세 정보 조회 실패:', error);
      return { success: false, error };
    }
  },

  // * Workflow 수동 실행
  dispatchWorkflow: async (
    owner: string,
    repo: string,
    ymlFileName: string,
    ref: string,
  ) => {
    try {
      const response = await workflowAPI.dispatch(owner, repo, ymlFileName, ref);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 수동 실행 실패:', error);
      return { success: false, error };
    }
  },

  // * Workflow 실행 취소
  cancelWorkflowRun: async (owner: string, repo: string, runId: string) => {
    try {
      const response = await workflowAPI.cancelRun(owner, repo, runId);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Workflow 실행 취소 실패:', error);
      return { success: false, error };
    }
  },
};
