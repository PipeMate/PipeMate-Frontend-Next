'use client';

import { useCallback, useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useRepository } from '@/contexts/RepositoryContext';
import { usePipeline, useUpdatePipeline } from '@/api';
import { AreaBasedWorkflowEditor } from '@/app/editor/components/AreaBasedWorkflowEditor';
import { ServerBlock } from '@/app/editor/types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ROUTES } from '@/config/appConstants';
import { usePageHeader } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Blocks, Edit, Home } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSetupGuard } from '@/hooks/useSetupGuard';
import { FullScreenLoading } from '@/components/ui';
import {
  convertLegacyWorkflow,
  generateFullYaml,
} from '@/app/editor/utils/yamlGenerator';

function WorkflowEditContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const file = searchParams.get('file') || '';
  const { owner, repo, isConfigured } = useRepository();
  const { setPageHeader, setPageActions, clearPageHeader } = usePageHeader();
  const EditIcon = ROUTES.WORKFLOWS.icon;

  // 설정 가드 - 토큰과 레포지토리 모두 필요
  const { isChecking, isSetupValid, hasToken, hasRepository } = useSetupGuard({
    requireToken: true,
    requireRepository: true,
    redirectTo: '/setup',
    onSetupChange: (tokenExists, repositoryExists) => {
      // 설정이 변경되면 페이지 상태를 업데이트
      if (!tokenExists || !repositoryExists) {
        // 설정이 누락된 경우 setup 페이지로 리다이렉트
        window.location.href = '/setup';
      }
    },
  });

  const {
    data: pipelineData,
    isLoading,
    refetch,
  } = usePipeline(file, owner || '', repo || '');
  const updatePipelineMutation = useUpdatePipeline();

  const [blocks, setBlocks] = useState<ServerBlock[]>([]);
  const [workflowName, setWorkflowName] = useState<string>(file);
  const [selectedBlock, setSelectedBlock] = useState<ServerBlock | undefined>();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (pipelineData?.data?.originalJson) {
      const originalData = pipelineData.data.originalJson;

      // 기존 데이터가 ServerBlock[] 형태인지 확인
      if (
        Array.isArray(originalData) &&
        originalData.length > 0 &&
        originalData[0].type
      ) {
        // 이미 ServerBlock[] 형태인 경우
        setBlocks(originalData as unknown as ServerBlock[]);
      } else {
        // 기존 YAML 형태인 경우 변환
        console.log('기존 YAML 데이터를 블록 형태로 변환합니다:', originalData);
        const convertedBlocks = convertLegacyWorkflow(originalData);
        console.log('변환된 블록:', convertedBlocks);
        setBlocks(convertedBlocks);
      }
    } else {
      setBlocks([]);
    }
  }, [pipelineData?.data?.originalJson]);

  // * 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!owner || !repo || !file) {
      toast.error('저장에 필요한 정보가 누락되었습니다.');
      return;
    }

    if (blocks.length === 0) {
      toast.error('저장할 워크플로우가 없습니다.');
      return;
    }

    // 파일명에서 .yml 확장자 제거
    const cleanFileName = file.replace(/\.yml$/, '');
    const finalName = (workflowName || cleanFileName).trim();

    try {
      console.log('저장 시도:', {
        owner,
        repo,
        originalFile: file,
        cleanFileName,
        finalName,
        blocksCount: blocks.length,
        blocks: blocks,
      });

      await updatePipelineMutation.mutateAsync({
        owner,
        repo,
        workflowName: finalName,
        inputJson: blocks as unknown as Record<string, unknown>[],
        description: 'PipeMate로 수정된 워크플로우',
      });

      toast.success(`워크플로우가 서버에 저장되었습니다: ${finalName}`);
      refetch();
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
      toast.error('워크플로우 저장에 실패했습니다.');
    }
  }, [owner, repo, file, workflowName, blocks, updatePipelineMutation, refetch]);

  // 저장 핸들러를 ref로 관리하여 useEffect 의존성 문제 해결
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // * 페이지 헤더 설정
  useEffect(() => {
    setPageHeader({
      title: '워크플로우 편집',
      description: `${owner}/${repo}`,
      breadcrumbs: [
        { label: '홈', href: '/', icon: Home },
        { label: '워크플로우', href: '/workflows', icon: ROUTES.WORKFLOWS.icon },
        { label: '편집', icon: Edit },
      ],
      badges: [
        {
          label: `${blocks.length} 블록`,
          variant: 'secondary',
          color: 'purple',
        },
      ],
    });

    setPageActions(
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-xs py-1 px-2 bg-purple-50 border-2 border-purple-300 text-purple-700"
        >
          <Blocks className="w-4 h-4 mr-2" /> {blocks.length} 블록
        </Badge>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="bg-blue-50 border-2 border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
        <Button
          onClick={() => handleSaveRef.current()}
          disabled={updatePipelineMutation.isPending || !isConfigured}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-500"
        >
          <Save className="w-4 h-4 mr-2" />
          저장
        </Button>
      </div>,
    );

    return () => {
      clearPageHeader();
    };
  }, [
    setPageHeader,
    setPageActions,
    clearPageHeader,
    owner,
    repo,
    blocks.length,
    updatePipelineMutation.isPending,
    isLoading,
    workflowName,
    isConfigured,
    refetch,
  ]);

  const handleWorkflowChange = useCallback((newBlocks: ServerBlock[]) => {
    try {
      console.log('저장되는 워크플로우 데이터:', JSON.stringify(newBlocks, null, 2));

      // 생성될 YAML 미리보기
      const generatedYaml = generateFullYaml(newBlocks);
      console.log('생성될 YAML:', generatedYaml);

      setBlocks(newBlocks);
    } catch (error) {
      console.error('워크플로우 처리 오류:', error);
    }
  }, []);

  const handleNodeSelect = useCallback((selectedBlock?: ServerBlock) => {
    setSelectedBlock(selectedBlock);
    if (selectedBlock === undefined) {
      setIsEditing(false);
    }
  }, []);

  const handleEditModeToggle = useCallback(() => {
    if (selectedBlock) {
      setIsEditing(!isEditing);
    }
  }, [selectedBlock, isEditing]);

  const handleBlockUpdate = useCallback((updatedBlock: ServerBlock) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)),
    );
    setSelectedBlock(updatedBlock);
  }, []);

  const handleWorkflowNameChange = useCallback((name: string) => {
    setWorkflowName(name);
  }, []);

  // 설정 확인 중일 때 로딩 표시
  if (isChecking || !isSetupValid) {
    return <FullScreenLoading message="설정을 확인하고 있습니다..." />;
  }

  if (!isConfigured) {
    return <div className="p-6">저장소 설정이 필요합니다.</div>;
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-full min-h-0 min-w-0 flex md:pr-80 xl:pr-96">
        <AreaBasedWorkflowEditor
          onWorkflowChange={handleWorkflowChange}
          onNodeSelect={handleNodeSelect}
          onEditModeToggle={handleEditModeToggle}
          isEditing={isEditing}
          initialBlocks={blocks}
          onBlockUpdate={handleBlockUpdate}
          mode="edit"
          initialWorkflowName={file}
          onWorkflowNameChange={handleWorkflowNameChange}
        />
      </div>
    </ErrorBoundary>
  );
}

export default function WorkflowEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkflowEditContent />
    </Suspense>
  );
}
