import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import { BlockResponse } from '@/api/types';

/**
 * Block 관리 API
 */
export const blockAPI = {
  // * 4.1 모든 블록 조회
  // PresetController에 맞춘 엔드포인트로 변경
  getAll: () => githubClient.get<BlockResponse[]>(API_ENDPOINTS.PRESETS.BLOCKS),
};
