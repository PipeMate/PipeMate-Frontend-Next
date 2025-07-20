//* 블록 팔레트 컴포넌트 (Blockly 기반)
"use client";

import { ControlButtons } from "./ControlButtons";

//* 블록 팔레트 props 타입
interface BlockPaletteProps {
  onAddExample: () => void;
  onClear: () => void;
  onAutoArrange: () => void;
}

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export const BlockPalette = ({
  onAddExample,
  onClear,
  onAutoArrange,
}: BlockPaletteProps) => {
  return (
    <div
      style={{
        width: "300px",
        minWidth: "250px", // 최소 너비 설정
        maxWidth: "350px", // 최대 너비 설정
        backgroundColor: "#f9fafb",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          flexShrink: 0, // 헤더 크기 고정
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "#111827",
          }}
        >
          GitHub Actions 블록
        </h3>
        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: "1.4",
          }}
        >
          Blockly에서는 툴박스에서 블록을 드래그하여 워크스페이스에 추가하세요.
        </p>
      </div>

      {/* 사용법 안내 */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#fef3c7",
          borderBottom: "1px solid #f59e0b",
          flexShrink: 0, // 안내 크기 고정
        }}
      >
        <h4
          style={{
            margin: "0 0 8px 0",
            fontSize: "14px",
            fontWeight: "600",
            color: "#92400e",
          }}
        >
          📋 사용법
        </h4>
        <ul
          style={{
            margin: 0,
            paddingLeft: "16px",
            fontSize: "12px",
            color: "#92400e",
            lineHeight: "1.4",
          }}
        >
          <li>워크플로우 트리거 블록을 먼저 추가하세요</li>
          <li>Job 블록을 추가하고 내부에 Step들을 배치하세요</li>
          <li>Step 블록들은 Job 블록 내부에만 들어갈 수 있습니다</li>
          <li>블록을 드래그하여 순서를 변경할 수 있습니다</li>
        </ul>
      </div>

      {/* 컨트롤 버튼 */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
          marginTop: "auto",
          flexShrink: 0, // 버튼 크기 고정
        }}
      >
        <ControlButtons
          onAddExample={onAddExample}
          onClear={onClear}
          onAutoArrange={onAutoArrange}
        />
      </div>
    </div>
  );
};
