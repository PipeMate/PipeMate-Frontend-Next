'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRepository } from '@/contexts/RepositoryContext';
import { usePipeline, useUpdatePipeline } from '@/api/hooks';
import { AreaBasedWorkflowEditor } from '@/app/github-actions-flow/components/AreaBasedWorkflowEditor';
import { ServerBlock } from '@/app/github-actions-flow/types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ROUTES } from '@/config/appConstants';
import { useLayout } from '@/components/layout/LayoutContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Blocks } from 'lucide-react';
import { toast } from 'react-toastify';

export default function WorkflowEditPage() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file') || '';
  const { owner, repo, isConfigured } = useRepository();
  const { setHeaderExtra, setHeaderRight } = useLayout();

  const {
    data: pipelineData,
    isLoading,
    refetch,
  } = usePipeline(file, owner || '', repo || '');
  const updatePipelineMutation = useUpdatePipeline();

  const [blocks, setBlocks] = useState<ServerBlock[]>([]);
  const [workflowName, setWorkflowName] = useState<string>(file);

  useEffect(() => {
    if (pipelineData?.data?.originalJson) {
      setBlocks(pipelineData.data.originalJson as unknown as ServerBlock[]);
    } else {
      setBlocks([]);
    }
  }, [pipelineData?.data?.originalJson]);

  useEffect(() => {
    const Icon = ROUTES.WORKFLOWS.icon;
    setHeaderExtra(
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex items-center justify-center rounded-md bg-blue-100 text-blue-700 p-2">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-base md:text-lg font-semibold text-slate-900 leading-tight">
            워크플로우 편집
          </div>
          <div className="text-xs md:text-sm text-slate-500 truncate">
            {owner && repo ? (
              <span className="text-slate-700">
                {owner}/{repo} • {file}
              </span>
            ) : (
              'GitHub Actions 워크플로우 편집'
            )}
          </div>
        </div>
      </div>,
    );
    setHeaderRight(
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" className="text-xs py-1 px-2">
          <Blocks className="w-4 h-4 mr-2" /> {blocks.length} 블록
        </Badge>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
        <Button
          onClick={async () => {
            if (!owner || !repo || !file) return;
            try {
              await updatePipelineMutation.mutateAsync({
                owner,
                repo,
                workflowName: workflowName || file,
                inputJson: blocks as unknown as Record<string, unknown>[],
                description: '',
              });
              toast.success(
                `워크플로우가 서버에 저장되었습니다: ${workflowName || file}`,
              );
              refetch();
            } catch (e) {
              toast.error('서버 저장 중 오류가 발생했습니다.');
            }
          }}
          disabled={updatePipelineMutation.isPending || !isConfigured}
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {updatePipelineMutation.isPending ? '저장 중...' : '저장'}
        </Button>
      </div>,
    );
    return () => {
      setHeaderExtra(null);
      setHeaderRight(null);
    };
  }, [
    blocks.length,
    isLoading,
    refetch,
    setHeaderExtra,
    setHeaderRight,
    owner,
    repo,
    file,
    updatePipelineMutation.isPending,
    isConfigured,
  ]);

  const handleWorkflowChange = useCallback((newBlocks: ServerBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  if (!isConfigured) {
    return <div className="p-6">저장소 설정이 필요합니다.</div>;
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-full min-h-0 min-w-0 flex">
        <AreaBasedWorkflowEditor
          onWorkflowChange={handleWorkflowChange}
          initialBlocks={blocks}
          mode="edit"
          initialWorkflowName={file}
          onWorkflowNameChange={(name) => setWorkflowName(name)}
        />
      </div>
    </ErrorBoundary>
  );
}
