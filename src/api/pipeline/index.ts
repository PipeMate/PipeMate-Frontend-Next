// * Pipeline 관리 API
// * - 파이프라인 생성/조회/수정/삭제 및 블록 기반 워크플로우 저장 기능 제공
import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import { PipelineRequest, PipelineResponse } from '@/api/types';
import { removeYmlExtension } from '@/lib/utils';
import { ServerBlock } from '@/app/github-actions-flow/types';

export const pipelineAPI = {
  // * 1.1 파이프라인 생성
  // * 파이프라인을 생성합니다.
  // * @param data 파이프라인 생성 요청 본문
  // * @returns 생성된 파이프라인 정보
  create: (data: PipelineRequest) => {
    // workflowName에서 .yml 확장자 제거
    const processedData = {
      ...data,
      workflowName: removeYmlExtension(data.workflowName),
    };
    return githubClient.post<string>(API_ENDPOINTS.PIPELINES.CREATE, processedData);
  },

  // * 1.2 파이프라인 조회
  // * 파이프라인을 조회합니다.
  // * @param ymlFileName 워크플로우 파일명(.yml/.yaml 허용)
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @returns 파이프라인 정보
  get: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.get<PipelineResponse>(
      API_ENDPOINTS.PIPELINES.GET(removeYmlExtension(ymlFileName), owner, repo),
    ),

  // * 1.3 파이프라인 업데이트
  // * 파이프라인을 업데이트합니다.
  // * @param data 파이프라인 업데이트 요청 본문
  // * @returns 업데이트된 파이프라인 정보
  update: (data: PipelineRequest) => {
    // workflowName에서 .yml 확장자 제거
    const processedData = {
      ...data,
      workflowName: removeYmlExtension(data.workflowName),
    };
    return githubClient.put<PipelineResponse>(
      API_ENDPOINTS.PIPELINES.UPDATE,
      processedData,
    );
  },

  // * 1.4 파이프라인 삭제
  // * 파이프라인을 삭제합니다.
  // * @param ymlFileName 워크플로우 파일명(.yml/.yaml 허용)
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @returns 삭제 결과
  delete: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.delete(
      API_ENDPOINTS.PIPELINES.DELETE(removeYmlExtension(ymlFileName), owner, repo),
    ),

  // * 1.5 워크플로우 저장 (ServerBlock 배열을 받아서 저장)
  // * 블록 기반 워크플로우를 저장합니다.
  // * @param data 워크플로우 저장 데이터
  // * @returns 저장 결과
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
