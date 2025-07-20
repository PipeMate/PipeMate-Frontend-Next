//* ========================================
//* GitHub Actions Flow 메인 페이지
//* ========================================
//* 이 페이지는 React Flow 기반 GitHub Actions 워크플로우 에디터의
//* 메인 페이지로, 워크플로우 편집과 YAML 미리보기 기능을 제공합니다.

"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { ReactFlowWorkspace } from "./components/ReactFlowWorkspace";
import { ServerBlock } from "./types";

//* ========================================
//* 메인 페이지 컴포넌트
//* ========================================

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export default function GitHubActionsFlowPage() {
  //* ========================================
  //* 상태 관리
  //* ========================================

  //* 워크플로우 블록 데이터
  const [blocks, setBlocks] = useState<ServerBlock[]>([]);

  //* 클라이언트 사이드 렌더링 확인
  const [isClient, setIsClient] = useState(false);

  //* ========================================
  //* 생명주기 관리
  //* ========================================

  //* 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  //* ========================================
  //* 이벤트 핸들러
  //* ========================================

  //* 워크플로우 변경 핸들러
  //? React Flow 워크스페이스에서 워크플로우가 변경될 때 호출
  const handleWorkflowChange = useCallback((newBlocks: ServerBlock[]) => {
    try {
      console.log("워크플로우 변경됨:", newBlocks);
      setBlocks(newBlocks);

      //* 서버로 데이터 전송 (실제 구현에서는 API 호출)
      // sendBlocksToServer(newBlocks);
    } catch (error) {
      console.error("워크플로우 처리 오류:", error);
    }
  }, []);

  //* ========================================
  //* 렌더링 조건부 처리
  //* ========================================

  //* 클라이언트 사이드에서만 렌더링
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

  //* ========================================
  //* 메인 렌더링
  //* ========================================

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ========================================
          헤더 영역
          ======================================== */}
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 제목 및 설명 */}
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
            }}
          >
            🔄 GitHub Actions Flow Editor
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "4px 0 0 0",
            }}
          >
            React Flow 기반 워크플로우 에디터
          </p>
        </div>

        {/* 현재 블록 수 표시 */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          📊 총 {blocks.length}개 블록
        </div>
      </div>

      {/* ========================================
          메인 컨텐츠 영역
          ======================================== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
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
            initialBlocks={blocks}
          />
        </Suspense>
      </div>

      {/* ========================================
          하단 정보 패널
          ======================================== */}
      <div
        style={{
          padding: "12px 24px",
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            💡 <strong>서버 데이터 형식:</strong> 모든 변경사항이 서버 형식으로
            자동 변환됩니다.
          </span>
          <span>🔄 마지막 업데이트: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
