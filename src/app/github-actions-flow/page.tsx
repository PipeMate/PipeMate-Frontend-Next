"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { ReactFlowWorkspace } from "./components/ReactFlowWorkspace";
import { YamlPreviewPanel } from "./components/YamlPreviewPanel";
import { ServerBlock } from "./types";
import { useLayout } from "@/components/layout/LayoutContext";
import { ROUTES } from "@/config/appConstants";
import { Blocks, Github } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function GitHubActionsFlowPage() {
  // 상태 관리
  const [blocks, setBlocks] = useState<ServerBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<ServerBlock | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 레이아웃 slot setter
  const { setHeaderRight, setHeaderExtra } = useLayout();

  // 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 헤더 slot에 동적 내용 주입
  useEffect(() => {
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
        <Blocks size={16} style={{ marginRight: 6 }} /> 총 {blocks.length}개
        블록
      </div>
    );
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
    return () => {
      setHeaderRight(null);
      setHeaderExtra(null);
    };
  }, [blocks.length, setHeaderRight, setHeaderExtra]);

  // 워크플로우 변경 핸들러
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

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback((selectedBlock?: ServerBlock) => {
    setSelectedBlock(selectedBlock);
    // 편집 모드가 활성화되어 있으면 해제
    if (selectedBlock === undefined) {
      setIsEditing(false);
    }
  }, []);

  // 편집 모드 토글 핸들러
  const handleEditModeToggle = useCallback(() => {
    if (selectedBlock) {
      setIsEditing(!isEditing);
    }
  }, [selectedBlock, isEditing]);

  // 편집된 블록 저장 핸들러
  const handleBlockUpdate = useCallback(
    (updatedBlock: ServerBlock) => {
      if (selectedBlock) {
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

  // 전체 워크플로우 업데이트 핸들러
  const handleWorkflowUpdate = useCallback((updatedBlocks: ServerBlock[]) => {
    setBlocks(updatedBlocks);
  }, []);

  // Suspense fallback UI (Skeleton 활용)
  const SuspenseFallback = (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 p-8 gap-4">
      <div className="w-full h-full max-w-lg flex flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="text-gray-400 mt-4">워크스페이스 로딩 중...</div>
    </div>
  );

  // 1. 클라이언트 마운트 전: 전체 Skeleton만 보여줌 (Suspense 사용 X)
  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-lg flex flex-col gap-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // 2. 클라이언트 마운트 후: 실제 페이지 + Suspense fallback
  return (
    <ErrorBoundary>
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 메인 컨텐츠 영역 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* React Flow 워크스페이스 */}
          <Suspense fallback={SuspenseFallback}>
            <ReactFlowWorkspace
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
              onWorkflowUpdate={handleWorkflowUpdate}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
