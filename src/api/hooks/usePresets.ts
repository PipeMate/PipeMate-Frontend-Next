import { useQuery } from '@tanstack/react-query';
import { presetsAPI } from '@/api/presets';
import { BlockResponse, PipelineResponse } from '@/api/types';

// 프리셋 블록/파이프라인 React Query 훅
export const usePresetBlocks = () =>
  useQuery({
    queryKey: ['preset-blocks'],
    queryFn: async () => {
      const res = await presetsAPI.getBlocks();
      return res.data as BlockResponse[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const usePresetPipelines = () =>
  useQuery({
    queryKey: ['preset-pipelines'],
    queryFn: async () => {
      const res = await presetsAPI.getPipelines();
      return res.data as PipelineResponse[];
    },
    staleTime: 5 * 60 * 1000,
  });
