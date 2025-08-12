import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import { PipelineResponse, BlockResponse } from '@/api/types';

/**
 * Presets API
 * - 프리셋 파이프라인/블록 조회 전용
 */
export const presetsAPI = {
  // 프리셋 파이프라인 목록 조회
  getPipelines: () =>
    githubClient.get<PipelineResponse[]>(API_ENDPOINTS.PRESETS.PIPELINES),

  // 프리셋 블록 목록 조회 (기존 blockAPI와 중복되지만, 일관성을 위해 제공)
  getBlocks: () => githubClient.get<BlockResponse[]>(API_ENDPOINTS.PRESETS.BLOCKS),
};
