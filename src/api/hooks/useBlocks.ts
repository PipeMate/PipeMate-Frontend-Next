// * 블록 관련 React Query 훅 모음
// * - 블록 목록 조회 기능을 제공합니다.
import { useQuery } from '@tanstack/react-query';
import { blockAPI } from '@/api';

// * 모든 블록 조회 훅
// * - 모든 블록 목록을 조회합니다.
// * - 5분간 캐시됩니다.
export const useBlocks = () => {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: () => blockAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
