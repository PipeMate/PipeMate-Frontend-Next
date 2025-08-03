import githubClient from "@/api/githubClient";
import { PipelineRequest, PipelineResponse } from "@/api/types";
import { removeYmlExtension } from "@/lib/utils";

// * Pipeline 관리 API
export const pipelineAPI = {
  // * 1.1 파이프라인 생성
  create: (data: PipelineRequest) => {
    // workflowName에서 .yml 확장자 제거
    const processedData = {
      ...data,
      workflowName: removeYmlExtension(data.workflowName),
    };
    return githubClient.post<string>("/api/pipelines", processedData);
  },

  // * 1.2 파이프라인 조회
  get: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.get<PipelineResponse>(
      `/api/pipelines/${removeYmlExtension(ymlFileName)}`,
      {
        params: { owner, repo },
      }
    ),

  // * 1.3 파이프라인 업데이트
  update: (data: PipelineRequest) => {
    // workflowName에서 .yml 확장자 제거
    const processedData = {
      ...data,
      workflowName: removeYmlExtension(data.workflowName),
    };
    return githubClient.put<PipelineResponse>("/api/pipelines", processedData);
  },

  // * 1.4 파이프라인 삭제
  delete: (ymlFileName: string, owner: string, repo: string) =>
    githubClient.delete(`/api/pipelines/${removeYmlExtension(ymlFileName)}`, {
      params: { owner, repo },
    }),
};
