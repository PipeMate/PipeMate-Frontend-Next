// * Presets API
// * - 프리셋 파이프라인/블록 조회 전용 기능을 제공합니다.
import apiClient from '../client';
import { API_ENDPOINTS } from '@/config';
import type { BlockResponse } from './types';
import type { PipelineResponse } from '../pipeline/types';

export const presetsAPI = {
  // * 프리셋 파이프라인 목록 조회
  getPipelines: () => apiClient.get<PipelineResponse[]>(API_ENDPOINTS.PRESETS.PIPELINES),

  // * 프리셋 블록 목록 조회
  getBlocks: () => apiClient.get<BlockResponse[]>(API_ENDPOINTS.PRESETS.BLOCKS),
};
