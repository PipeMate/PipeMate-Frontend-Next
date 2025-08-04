"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { AreaBasedWorkflowEditor } from "./components/AreaBasedWorkflowEditor";
import { YamlPreviewPanel } from "./components/YamlPreviewPanel";
import { ServerBlock } from "./types";
import { useLayout } from "@/components/layout/LayoutContext";
import { ROUTES } from "@/config/appConstants";
import { Blocks, Github } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

/**
 * GitHub Actions Flow 페이지
 *
 * 블록 기반 워크플로우 에디터를 제공하는 메인 페이지입니다.
 * 사용자는 드래그 앤 드롭으로 블록을 추가하고, YAML 미리보기를 통해
 * 생성된 GitHub Actions 워크플로우를 확인할 수 있습니다.
 */
export default function GitHubActionsFlowPage() {
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

  //* ========================================
  //* 헤더 UI 설정
  //* ========================================

  //* 헤더에 동적 내용 주입 (블록 개수 표시, 페이지 제목 등)
  useEffect(() => {
    //* 클라이언트에서만 헤더 설정 (hydration 에러 방지)
    if (typeof window !== "undefined") {
      //* 헤더 우측에 블록 개수 표시
      setHeaderRight(
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Blocks size={16} style={{ marginRight: 6 }} />총 {blocks.length}개
          블록
        </div>
      );

      //* 헤더 추가 영역에 페이지 제목과 설명
      setHeaderExtra(
        <div className="flex flex-col gap-0 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 m-0 flex items-center gap-2">
            <Github size={20} />
            {ROUTES.ACTION_FLOW.label}
          </h1>
          <p className="text-sm text-gray-500 m-0">
            블록 기반 GitHub Actions 워크플로우 에디터
          </p>
        </div>
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

  /**
   * 워크플로우 변경 핸들러
   * AreaBasedWorkflowEditor에서 블록이 추가/삭제/수정될 때 호출
   */
  const handleWorkflowChange = useCallback((newBlocks: ServerBlock[]) => {
    try {
      console.log(
        "저장되는 워크플로우 데이터:",
        JSON.stringify(newBlocks, null, 2)
      );
      setBlocks(newBlocks);
    } catch (error) {
      console.error("워크플로우 처리 오류:", error);
    }
  }, []);

  /**
   * 노드 선택 핸들러
   * 사용자가 워크플로우 에디터에서 노드를 선택할 때 호출
   * YAML 미리보기 패널 표시 여부를 결정
   */
  const handleNodeSelect = useCallback((selectedBlock?: ServerBlock) => {
    setSelectedBlock(selectedBlock);
    //* 블록 선택이 해제되면 편집 모드도 해제
    if (selectedBlock === undefined) {
      setIsEditing(false);
    }
  }, []);

  /**
   * 편집 모드 토글 핸들러
   * YAML 미리보기 패널에서 편집 모드를 토글할 때 호출
   */
  const handleEditModeToggle = useCallback(() => {
    if (selectedBlock) {
      setIsEditing(!isEditing);
    }
  }, [selectedBlock, isEditing]);

  /**
   * 블록 업데이트 핸들러
   * YAML 미리보기 패널에서 블록 내용을 수정할 때 호출
   */
  const handleBlockUpdate = useCallback(
    (updatedBlock: ServerBlock) => {
      if (selectedBlock) {
        //* 선택된 블록을 업데이트된 블록으로 교체
        const updatedBlocks = blocks.map((block) =>
          block.name === selectedBlock.name && block.type === selectedBlock.type
            ? updatedBlock
            : block
        );
        setBlocks(updatedBlocks);
        setSelectedBlock(updatedBlock);
      }
    },
    [selectedBlock, blocks]
  );

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
    []
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
          />
        </Suspense>

        {/* YAML 미리보기 패널: 노드가 선택된 경우에만 표시 */}
        {selectedBlock && (
          <YamlPreviewPanel
            blocks={blocks}
            selectedBlock={selectedBlock}
            isEditing={isEditing}
            onBlockUpdate={handleBlockUpdate}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
