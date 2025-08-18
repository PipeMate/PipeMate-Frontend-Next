// * Presets 관련 React Query 훅
import { useQuery } from '@tanstack/react-query';
import { presetsAPI } from './api';
import type { BlockResponse } from './types';
import type { PipelineResponse } from '../pipeline/types';

// * 프리셋 블록 목록 조회
export const usePresetBlocks = () =>
  useQuery({
    queryKey: ['preset-blocks'],
    queryFn: async () => {
      const res = await presetsAPI.getBlocks();
      return res.data as BlockResponse[];
    },
    staleTime: 5 * 60 * 1000, // 5분
  });

// * 프리셋 파이프라인 목록 조회
export const usePresetPipelines = () =>
  useQuery({
    queryKey: ['preset-pipelines'],
    queryFn: async () => {
      const res = await presetsAPI.getPipelines();
      return res.data as PipelineResponse[];
    },
    staleTime: 5 * 60 * 1000, // 5분
  });

// * 하위 호환성을 위한 별칭
export const useBlocks = usePresetBlocks;
