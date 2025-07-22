//* ========================================
//* YAML 미리보기 패널 컴포넌트
//* ========================================
//* 이 컴포넌트는 선택된 블록의 YAML과 전체 워크플로우 YAML을
//* 실시간으로 미리보기하고 복사/다운로드 기능을 제공합니다.

"use client";

import { useState, useCallback } from "react";
import { ServerBlock } from "../types";
import { generateBlockYaml, generateFullYaml } from "../utils/yamlGenerator";

//* ========================================
//* Props 타입 정의
//* ========================================

interface YamlPreviewPanelProps {
  blocks: ServerBlock[]; //* 전체 블록 배열
  selectedBlock?: ServerBlock; //* 선택된 블록 (선택적)
}

//* ========================================
//* YAML 미리보기 패널 컴포넌트
//* ========================================

export const YamlPreviewPanel = ({
  blocks,
  selectedBlock,
}: YamlPreviewPanelProps) => {
  //* 뷰 모드 상태 (블록별 / 전체)
  const [viewMode, setViewMode] = useState<"block" | "full">("block");

  //* ========================================
  //* YAML 생성 함수들
  //* ========================================

  //* 선택된 블록의 YAML 생성
  //? 선택된 블록이 있으면 해당 블록의 YAML을, 없으면 안내 메시지를 반환
  const getBlockYaml = useCallback(() => {
    if (selectedBlock) {
      return generateBlockYaml(selectedBlock);
    }
    return "# 블록을 선택하여 YAML을 확인하세요";
  }, [selectedBlock]);

  //* 전체 YAML 생성
  //? 모든 블록을 포함한 완전한 워크플로우 YAML을 생성
  const getFullYaml = useCallback(() => {
    if (blocks.length > 0) {
      return generateFullYaml(blocks);
    }
    return "# 워크플로우를 구성하여 YAML을 확인하세요";
  }, [blocks]);

  //* ========================================
  //* 액션 함수들
  //* ========================================

  //* YAML을 클립보드에 복사
  //! 현재 뷰 모드에 따라 YAML을 클립보드에 복사
  const copyYaml = useCallback(() => {
    const yaml = viewMode === "block" ? getBlockYaml() : getFullYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      console.log("YAML이 클립보드에 복사되었습니다.");
    });
  }, [viewMode, getBlockYaml, getFullYaml]);

  //* ========================================
  //* 렌더링
  //* ========================================

  return (
    <div
      style={{
        width: "400px",
        height: "100%",
        minHeight: 0,
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #e5e7eb",
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
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#111827",
            margin: 0,
          }}
        >
          📄 YAML 미리보기
        </h3>

        {/* 뷰 모드 토글 버튼들 */}
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setViewMode("block")}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              backgroundColor: viewMode === "block" ? "#3b82f6" : "#f3f4f6",
              color: viewMode === "block" ? "#ffffff" : "#6b7280",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            블록
          </button>
          <button
            onClick={() => setViewMode("full")}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              backgroundColor: viewMode === "full" ? "#3b82f6" : "#f3f4f6",
              color: viewMode === "full" ? "#ffffff" : "#6b7280",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            전체
          </button>
        </div>
      </div>

      {/* ========================================
          선택된 블록 정보 (블록 모드일 때만)
          ======================================== */}
      {viewMode === "block" && selectedBlock && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            {selectedBlock.name}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            {selectedBlock.description}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
            타입: {selectedBlock.type} | 카테고리: {selectedBlock.category}
          </div>
        </div>
      )}

      {/* ========================================
          YAML 내용 표시 영역
          ======================================== */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "16px",
          overflow: "auto",
          backgroundColor: "#1f2937",
          color: "#f9fafb",
          fontFamily: "monospace",
          fontSize: "12px",
          lineHeight: "1.5",
          height: "100%",
        }}
      >
        <pre
          style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {viewMode === "block" ? getBlockYaml() : getFullYaml()}
        </pre>
      </div>

      {/* ========================================
          하단 액션 버튼들
          ======================================== */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "8px",
        }}
      >
        {/* 복사 버튼 */}
        <button
          onClick={copyYaml}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "12px",
            backgroundColor: "#10b981",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#059669";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#10b981";
          }}
        >
          📋 복사
        </button>

        {/* 다운로드 버튼 */}
        <button
          onClick={() => {
            const yaml = viewMode === "block" ? getBlockYaml() : getFullYaml();
            const blob = new Blob([yaml], { type: "text/yaml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = viewMode === "block" ? "block.yaml" : "workflow.yaml";
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "12px",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          💾 다운로드
        </button>
      </div>
    </div>
  );
};
