import githubClient from '@/api/githubClient';
import { BlockResponse } from '@/api/types';

/**
 * Block 관리 API
 */
export const blockAPI = {
  // * 4.1 모든 블록 조회
  // PresetController에 맞춘 엔드포인트로 변경
  getAll: () => githubClient.get<BlockResponse[]>('/api/presets/blocks'),
};
