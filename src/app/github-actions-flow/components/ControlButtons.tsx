//* 컨트롤 버튼 컴포넌트
"use client";

import { ControlButtonsProps } from "../types";

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export const ControlButtons = ({
  onAddExample,
  onClear,
  onAutoArrange,
}: ControlButtonsProps) => {
  return (
    <div
      style={{
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      {/* 예제 추가 및 초기화 버튼 */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onAddExample}
          style={{
            padding: "8px 12px",
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            flex: 1,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3730a3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4f46e5";
          }}
        >
          예제 추가
        </button>
        <button
          onClick={onClear}
          style={{
            padding: "8px 12px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            flex: 1,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
          }}
        >
          초기화
        </button>
      </div>

      {/* 순서 자동 정렬 버튼 */}
      <button
        onClick={onAutoArrange}
        style={{
          padding: "8px 12px",
          backgroundColor: "#059669",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#047857";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#059669";
        }}
      >
        순서 자동 정렬
      </button>
    </div>
  );
};
