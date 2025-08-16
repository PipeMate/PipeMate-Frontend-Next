'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaBasedWorkflowEditor } from './components/AreaBasedWorkflowEditor';

import { ServerBlock } from './types';
import { useLayout } from '@/components/layout/LayoutContext';
import { ROUTES } from '@/config/appConstants';
import { Blocks, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRepository } from '@/contexts/RepositoryContext';
import { useCreatePipeline } from '@/api';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

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

  //* 레이아웃 컨텍스트에서 헤더 slot setter 가져오기
  const { setHeaderRight, setHeaderExtra } = useLayout();
  const FlowIcon = ROUTES.ACTION_FLOW.icon;
  const { owner, repo, isConfigured } = useRepository();
  const createPipeline = useCreatePipeline();
  const [workflowName, setWorkflowName] = useState<string>('');
  const searchParams = useSearchParams();

  //* ========================================
  //* 헤더 UI 설정
  //* ========================================

  //* 헤더에 동적 내용 주입 (블록 개수 표시, 페이지 제목 등)
  useEffect(() => {
    //* 클라이언트에서만 헤더 설정 (hydration 에러 방지)
    if (typeof window !== 'undefined') {
      // 헤더 우측: 블록 수 + 최종 저장 버튼
      setHeaderRight(
        <div className="inline-flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-gray-100 text-gray-700 px-3 py-2 text-sm">
            <Blocks size={16} /> 총 {blocks.length}개 블록
          </div>
          <Button
            size="sm"
            onClick={async () => {
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
                await createPipeline.mutateAsync({
                  owner: owner!,
                  repo: repo!,
                  workflowName: finalName,
                  inputJson: blocks as unknown as Record<string, unknown>[],
                  description: 'PipeMate로 생성된 워크플로우',
                });
                toast.success(`워크플로우가 서버에 저장되었습니다: ${finalName}`);
              } catch (e) {
                toast.error('서버 저장 중 오류가 발생했습니다.');
              }
            }}
          >
            <Save size={14} className="mr-1" /> 최종 저장
          </Button>
        </div>,
      );

      // 헤더 좌측 확장: 타이틀/서브텍스트 + 아이콘
      setHeaderExtra(
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white p-2">
              <FlowIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-base md:text-lg font-semibold text-slate-900 leading-tight">
                {ROUTES.ACTION_FLOW.label}
              </div>
              <div className="text-xs md:text-sm text-slate-500 truncate">
                블록 기반 워크플로우 에디터
              </div>
            </div>
          </div>
        </div>,
      );
    }

    //* 컴포넌트 언마운트 시 헤더 초기화
    return () => {
      setHeaderRight(null);
      setHeaderExtra(null);
    };
  }, [blocks.length, setHeaderRight, setHeaderExtra]);

  //* ========================================
  //* 이벤트 핸들러
  //* ========================================

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
  const handleBlockUpdate = useCallback(
    (updatedBlock: ServerBlock) => {
      if (selectedBlock) {
        //* 선택된 블록을 업데이트된 블록으로 교체
        const updatedBlocks = blocks.map((block) =>
          block.name === selectedBlock.name && block.type === selectedBlock.type
            ? updatedBlock
            : block,
        );
        setBlocks(updatedBlocks);
        setSelectedBlock(updatedBlock);
      }
    },
    [selectedBlock, blocks],
  );

  // Presets 페이지에서 넘어온 blocks 쿼리 파라미터 파싱 → 초기 블록 주입
  useEffect(() => {
    const raw = searchParams.get('blocks');
    if (!raw) return;
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        setBlocks(parsed as ServerBlock[]);
        toast.success('프리셋 블록이 워크스페이스에 추가되었습니다.');
      }
    } catch (e) {
      console.error('프리셋 블록 파싱 실패:', e);
      toast.error('프리셋 블록을 불러오지 못했습니다.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //* ========================================
  //* UI 컴포넌트
  //* ========================================

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
