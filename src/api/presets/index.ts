// * Presets API
// * - 프리셋 파이프라인/블록 조회 전용 기능을 제공합니다.
import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import { PipelineResponse, BlockResponse } from '@/api/types';

export const presetsAPI = {
  // * 프리셋 파이프라인 목록 조회
  // * 프리셋 파이프라인 목록을 조회합니다.
  // * @returns 프리셋 파이프라인 목록
  getPipelines: () =>
    githubClient.get<PipelineResponse[]>(API_ENDPOINTS.PRESETS.PIPELINES),

  // * 프리셋 블록 목록 조회 (기존 blockAPI와 중복되지만, 일관성을 위해 제공)
  // * 프리셋 블록 목록을 조회합니다.
  // * @returns 프리셋 블록 목록
  getBlocks: () => githubClient.get<BlockResponse[]>(API_ENDPOINTS.PRESETS.BLOCKS),
};
