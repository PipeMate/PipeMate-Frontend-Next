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
    <div className="w-[400px] h-full min-h-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* ========================================
          헤더 영역
          ======================================== */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 m-0">
          📄 YAML 미리보기
        </h3>

        {/* 뷰 모드 토글 버튼들 */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("block")}
            className={`px-2 py-1 text-xs rounded cursor-pointer border-none ${
              viewMode === "block"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            블록
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={`px-2 py-1 text-xs rounded cursor-pointer border-none ${
              viewMode === "full"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* ========================================
          선택된 블록 정보 (블록 모드일 때만)
          ======================================== */}
      {viewMode === "block" && selectedBlock && (
        <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {selectedBlock.name}
          </div>
          <div className="text-xs text-gray-500">
            {selectedBlock.description}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            타입: {selectedBlock.type} | 카테고리: {selectedBlock.category}
          </div>
        </div>
      )}

      {/* ========================================
          YAML 내용 표시 영역
          ======================================== */}
      <div className="flex-1 min-h-0 p-4 overflow-auto bg-gray-800 text-slate-50 font-mono text-xs leading-[1.5] h-full">
        <pre className="m-0 whitespace-pre-wrap break-words">
          {viewMode === "block" ? getBlockYaml() : getFullYaml()}
        </pre>
      </div>

      {/* ========================================
          하단 액션 버튼들
          ======================================== */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        {/* 복사 버튼 */}
        <button
          onClick={copyYaml}
          className="flex-1 px-3 py-2 text-xs bg-emerald-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-emerald-600"
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
          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white border-none rounded cursor-pointer transition-colors hover:bg-blue-700"
        >
          💾 다운로드
        </button>
      </div>
    </div>
  );
};
