'use client';

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { AreaBasedWorkflowEditor } from './components/AreaBasedWorkflowEditor';

import { ServerBlock } from './types';
import { usePageHeader } from '@/components/layout';
import { ROUTES } from '@/config/appConstants';
import { Blocks, Save, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRepository } from '@/contexts/RepositoryContext';
import { useCreatePipeline } from '@/api';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSetupGuard } from '@/hooks/useSetupGuard';
import { FullScreenLoading } from '@/components/ui';

// * GitHub Actions Flow 페이지 내부 컴포넌트
function GitHubActionsFlowContent() {
  //* ========================================
  //* 상태 관리
  //* ========================================

  //* 워크플로우 블록 목록
  const [blocks, setBlocks] = useState<ServerBlock[]>([]);

  //* 현재 선택된 블록 (YAML 미리보기 패널 표시용)
  const [selectedBlock, setSelectedBlock] = useState<ServerBlock | undefined>();

  //* 편집 모드 상태 (YAML 미리보기 패널에서 사용)
  const [isEditing, setIsEditing] = useState(false);

  //* 워크플로우 이름
  const [workflowName, setWorkflowName] = useState<string>('');

  //* ========================================
  //* Hook 호출 (모든 Hook을 조건부 렌더링 전에 호출)
  //* ========================================

  //* 레이아웃 컨텍스트에서 헤더 slot setter 가져오기
  const { setPageHeader, setPageActions, clearPageHeader } = usePageHeader();
  const FlowIcon = ROUTES.ACTION_FLOW.icon;
  const { owner, repo, isConfigured } = useRepository();
  const createPipeline = useCreatePipeline();
  const createPipelineRef = useRef(createPipeline);
  createPipelineRef.current = createPipeline;
  const searchParams = useSearchParams();
  const pathname = usePathname();

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

  // * 페이지 헤더 설정
  useEffect(() => {
    setPageHeader({
      title: ROUTES.ACTION_FLOW.label,
      description: '블록을 드래그하여 워크플로우를 시각적으로 설계하세요',
      breadcrumbs: [
        { label: '홈', href: '/', icon: Home },
        { label: ROUTES.ACTION_FLOW.label, icon: FlowIcon },
      ],
      badges: [
        {
          label: `${blocks.length} 블록`,
          variant: 'secondary',
          color: 'blue',
        },
      ],
    });

    setPageActions(
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSaveWorkflow}
          disabled={createPipeline.isPending || blocks.length === 0}
          variant="outline"
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {createPipeline.isPending ? '저장 중...' : '워크플로우 저장'}
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
    blocks.length,
    createPipeline.isPending,
  ]);

  //* ========================================
  //* 이벤트 핸들러
  //* ========================================

  // * 워크플로우 저장 핸들러
  const handleSaveWorkflow = useCallback(async () => {
    if (!isConfigured) {
      toast.error('저장소가 설정되지 않았습니다. 먼저 저장소를 설정해주세요.');
      return;
    }
    if (blocks.length === 0) {
      toast.error('저장할 워크플로우가 없습니다.');
      return;
    }
    const finalName = (workflowName || `workflow-${Date.now()}`).trim();
    try {
      await createPipelineRef.current.mutateAsync({
        owner: owner!,
        repo: repo!,
        workflowName: finalName,
        inputJson: blocks as unknown as Record<string, unknown>[],
        description: 'PipeMate로 생성된 워크플로우',
      });
      toast.success(`워크플로우가 서버에 저장되었습니다: ${finalName}`);
    } catch (e) {
      console.error('워크플로우 저장 실패:', e);
      toast.error('워크플로우 저장에 실패했습니다.');
    }
  }, [blocks, workflowName, isConfigured, owner, repo]);

  // * 워크플로우 변경 핸들러
  // * AreaBasedWorkflowEditor에서 블록이 추가/삭제/수정될 때 호출
  const handleWorkflowChange = useCallback((newBlocks: ServerBlock[]) => {
    try {
      console.log('저장되는 워크플로우 데이터:', JSON.stringify(newBlocks, null, 2));
      setBlocks(newBlocks);
    } catch (error) {
      console.error('워크플로우 처리 오류:', error);
    }
  }, []);

  // * 노드 선택 핸들러
  // * 사용자가 워크플로우 에디터에서 노드를 선택할 때 호출
  // * YAML 미리보기 패널 표시 여부를 결정
  const handleNodeSelect = useCallback((selectedBlock?: ServerBlock) => {
    setSelectedBlock(selectedBlock);
    //* 블록 선택이 해제되면 편집 모드도 해제
    if (selectedBlock === undefined) {
      setIsEditing(false);
    }
  }, []);

  // * 편집 모드 토글 핸들러
  // * YAML 미리보기 패널에서 편집 모드를 토글할 때 호출
  const handleEditModeToggle = useCallback(() => {
    if (selectedBlock) {
      setIsEditing(!isEditing);
    }
  }, [selectedBlock, isEditing]);

  // * 블록 업데이트 핸들러
  // * YAML 미리보기 패널에서 블록 내용을 수정할 때 호출
  const handleBlockUpdate = useCallback((updatedBlock: ServerBlock) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)),
    );
    setSelectedBlock(updatedBlock);
  }, []);

  // * 워크플로우 이름 변경 핸들러
  const handleWorkflowNameChange = useCallback((name: string) => {
    setWorkflowName(name);
  }, []);

  //* ========================================
  //* 메모이제이션된 값들
  //* ========================================

  // * 선택된 블록의 YAML 데이터 (메모이제이션)
  const selectedBlockYaml = useMemo(() => {
    if (!selectedBlock) return '';
    try {
      return JSON.stringify(selectedBlock, null, 2);
    } catch (error) {
      console.error('YAML 변환 오류:', error);
      return '';
    }
  }, [selectedBlock]);

  //* Suspense fallback UI (로딩 상태 표시)
  const SuspenseFallback = useMemo(
    () => (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 p-8 gap-4">
        <div className="w-full h-full max-w-lg flex flex-col gap-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="text-gray-400 mt-4">워크스페이스 로딩 중...</div>
      </div>
    ),
    [],
  );

  //* ========================================
  //* useEffect (조건부 렌더링 전에 호출)
  //* ========================================

  // 설정이 필요하면 리다이렉트
  useEffect(() => {
    if (!isChecking && !isSetupValid) {
      // 설정이 유효하지 않은 경우 setup 페이지로 리다이렉트
      window.location.href = '/setup';
    }
  }, [isChecking, isSetupValid]);

  //* ========================================
  //* 조건부 렌더링
  //* ========================================

  // 설정 확인 중일 때 로딩 표시
  if (isChecking || !isSetupValid) {
    return <FullScreenLoading message="설정을 확인하고 있습니다..." />;
  }

  //* ========================================
  //* 메인 렌더링
  //* ========================================

  return (
    <ErrorBoundary>
      <div className="w-full h-full min-h-0 min-w-0 flex">
        {/* 영역 기반 워크플로우 에디터 */}
        <Suspense fallback={SuspenseFallback}>
          <AreaBasedWorkflowEditor
            onWorkflowChange={handleWorkflowChange}
            onNodeSelect={handleNodeSelect}
            onEditModeToggle={handleEditModeToggle}
            isEditing={isEditing}
            initialBlocks={blocks}
            onBlockUpdate={handleBlockUpdate}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

// * GitHub Actions Flow 페이지
// *
// * 블록 기반 워크플로우 에디터를 제공하는 메인 페이지입니다.
// * 사용자는 드래그 앤 드롭으로 블록을 추가하고, YAML 미리보기를 통해
// * 생성된 GitHub Actions 워크플로우를 확인할 수 있습니다.
export default function GitHubActionsFlowPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GitHubActionsFlowContent />
    </Suspense>
  );
}
