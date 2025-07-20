//* YAML 패널 컴포넌트
"use client";

import { YamlPanelProps } from "../types";

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export const YamlPanel = ({ generatedYaml }: YamlPanelProps) => {
  return (
    <div
      style={{
        width: "280px", // 기본 너비
        minWidth: "220px", // 최소 너비 설정
        maxWidth: "400px", // 최대 너비 설정
        backgroundColor: "#1f2937",
        borderLeft: "1px solid #374151",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #374151",
          backgroundColor: "#111827",
          flexShrink: 0, // 헤더 크기 고정
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "600",
            color: "#f9fafb",
          }}
        >
          생성된 YAML
        </h3>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "11px",
            color: "#9ca3af",
            lineHeight: "1.3",
          }}
        >
          실시간으로 생성되는 GitHub Actions 워크플로우
        </p>
      </div>

      {/* YAML 내용 */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflow: "auto",
          minHeight: 0, // flexbox에서 중요한 설정
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: "11px",
            lineHeight: "1.4",
            color: "#e5e7eb",
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {generatedYaml || "# 워크플로우를 구성하면 여기에 YAML이 생성됩니다."}
        </pre>
      </div>
    </div>
  );
};
