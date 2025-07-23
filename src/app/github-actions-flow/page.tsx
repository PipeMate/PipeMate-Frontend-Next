//* ========================================
//* GitHub Actions Flow 메인 페이지
//* ========================================
//* 이 페이지는 React Flow 기반 GitHub Actions 워크플로우 에디터의
//* 메인 페이지로, 워크플로우 편집과 YAML 미리보기 기능을 제공합니다.

"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { ReactFlowWorkspace } from "./components/ReactFlowWorkspace";
import { YamlPreviewPanel } from "./components/YamlPreviewPanel";
import { ServerBlock } from "./types";
import { useLayout } from "@/components/layout/LayoutContext";
import { ROUTES } from "@/config/appConstants";
import { Blocks, Github } from "lucide-react";

export default function GitHubActionsFlowPage() {
  // 상태 관리
  const [blocks, setBlocks] = useState<ServerBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<ServerBlock | undefined>();
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          minWidth: 0,
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#111827",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Github size={20} style={{ marginRight: 8 }} />
          {ROUTES.ACTION_FLOW.label}
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            margin: "2px 0 0 0",
          }}
        >
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
      setBlocks(newBlocks);
    } catch (error) {
      console.error("워크플로우 처리 오류:", error);
    }
  }, []);

  // 워크스페이스 초기화 핸들러
  const handleClearWorkspace = useCallback(() => {
    setBlocks([]); // blocks 상태도 직접 초기화
  }, []);

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback((selectedBlock?: ServerBlock) => {
    setSelectedBlock(selectedBlock);
  }, []);

  // 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          color: "#6b7280",
        }}
      >
        로딩 중...
      </div>
    );
  }

  // 메인 컨텐츠만 렌더링 (헤더/사이드바 UI 제거)
  return (
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
        <Suspense
          fallback={
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f9fafb",
                color: "#6b7280",
              }}
            >
              React Flow 워크스페이스 로딩 중...
            </div>
          }
        >
          <ReactFlowWorkspace
            onWorkflowChange={handleWorkflowChange}
            onNodeSelect={handleNodeSelect}
            initialBlocks={blocks}
            onClearWorkspace={handleClearWorkspace}
          />
        </Suspense>
        {/* YAML 미리보기 패널: 노드가 선택된 경우에만 표시 */}
        {selectedBlock && (
          <YamlPreviewPanel blocks={blocks} selectedBlock={selectedBlock} />
        )}
      </div>
    </div>
  );
}
