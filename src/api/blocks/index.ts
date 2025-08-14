// * Block 관리 API
// * - 블록 목록 조회 기능을 제공합니다.
import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import { BlockResponse } from '@/api/types';

export const blockAPI = {
  // * 4.1 모든 블록 조회
  // * 모든 블록 목록을 조회합니다.
  // * @returns 블록 목록
  getAll: () => githubClient.get<BlockResponse[]>(API_ENDPOINTS.PRESETS.BLOCKS),
};
