/**
 * 블록 관련 React Query 훅
 */
import { useQuery } from '@tanstack/react-query';
import { blockAPI } from '@/api/blocks';

// * 모든 블록 조회
export const useBlocks = () => {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: () => blockAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
