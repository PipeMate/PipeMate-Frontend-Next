// * Pipeline 관리 API
// * - 파이프라인 생성/조회/수정/삭제 및 블록 기반 워크플로우 저장 기능 제공
import githubClient from '../githubClient';
import { API_ENDPOINTS } from '@/config';
import type { PipelineRequest, PipelineResponse } from './types';
import { removeYmlExtension } from '@/lib/utils';
import type { ServerBlock } from '@/app/editor/types';

export const pipelineAPI = {
  // * 파이프라인 생성
  create: (data: PipelineRequest) => {
    // * workflowName에서 .yml 확장자 제거
    const processedData = {
      ...data,
      workflowName: removeYmlExtension(data.workflowName),
    };
    return githubClient.post<string>(API_ENDPOINTS.PIPELINES.CREATE, processedData);
  },

  // * 파이프라인 조회
  get: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.get<PipelineResponse>(
      API_ENDPOINTS.PIPELINES.GET(removeYmlExtension(ymlFileName), owner, repo),
    ),

  // * 파이프라인 업데이트
  update: (data: PipelineRequest) => {
    // * workflowName에서 .yml 확장자 제거
    const processedData = {
      ...data,
      workflowName: removeYmlExtension(data.workflowName),
    };
    return githubClient.put<PipelineResponse>(
      API_ENDPOINTS.PIPELINES.UPDATE,
      processedData,
    );
  },

  // * 파이프라인 삭제
  delete: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.delete(
      API_ENDPOINTS.PIPELINES.DELETE(removeYmlExtension(ymlFileName), owner, repo),
    ),

  // * 워크플로우 저장 (ServerBlock 배열을 받아서 저장)
  saveWorkflow: (data: {
    owner: string;
    repo: string;
    workflowName: string;
    blocks: ServerBlock[];
    description?: string;
  }) => {
    const processedData: PipelineRequest = {
      owner: data.owner,
      repo: data.repo,
      workflowName: removeYmlExtension(data.workflowName),
      inputJson: data.blocks,
      description: data.description,
    };
    return githubClient.post<string>(API_ENDPOINTS.PIPELINES.CREATE, processedData);
  },
};
