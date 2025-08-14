// * 프리셋 관련 React Query 훅 모음
// * - 프리셋 블록 및 파이프라인 조회 기능을 제공합니다.
import { useQuery } from '@tanstack/react-query';
import { presetsAPI } from '@/api/presets';
import { BlockResponse, PipelineResponse } from '@/api/types';

// * 프리셋 블록 목록 조회 훅
// * - 모든 프리셋 블록을 조회합니다.
// * - 5분간 캐시됩니다.
export const usePresetBlocks = () =>
  useQuery({
    queryKey: ['preset-blocks'],
    queryFn: async () => {
      const res = await presetsAPI.getBlocks();
      return res.data as BlockResponse[];
    },
    staleTime: 5 * 60 * 1000, // 5분
  });

// * 프리셋 파이프라인 목록 조회 훅
// * - 모든 프리셋 파이프라인을 조회합니다.
// * - 5분간 캐시됩니다.
export const usePresetPipelines = () =>
  useQuery({
    queryKey: ['preset-pipelines'],
    queryFn: async () => {
      const res = await presetsAPI.getPipelines();
      return res.data as PipelineResponse[];
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
