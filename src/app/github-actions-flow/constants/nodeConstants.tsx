//* ========================================
//* 노드 상수 정의
//* ========================================
//* 이 파일은 GitHub Actions 워크플로우 에디터의
//* 노드 제목, 색상, 아이콘, 핸들 설정을 정의합니다.

import { Position } from "@xyflow/react";
import {
  RefreshCcw,
  Cog,
  Wrench,
  Package,
  Play,
  Settings,
  Layers,
  Zap,
  Code,
  Database,
  Server,
  Cloud,
} from "lucide-react";
import React from "react";

//* ========================================
//* 노드 타입 정의
//* ========================================

//* 노드 타입을 명시적으로 정의
export type NodeType = "TRIGGER" | "JOB" | "STEP" | "STEPS";

//* ========================================
//* 노드 제목 상수
//* ========================================

//* 각 노드 타입별 표시 제목
export const NODE_TITLES: Record<NodeType, string> = {
  TRIGGER: "워크플로우 트리거",
  JOB: "Job 설정",
  STEP: "Step",
  STEPS: "Steps Container",
} as const;

//* ========================================
//* 노드 색상 상수
//* ========================================

//* 각 노드 타입별 색상 정의
export const NODE_COLORS: Record<
  NodeType,
  {
    bg: string;
    border: string;
    text: string;
    hover: string;
  }
> = {
  TRIGGER: {
    bg: "#ecfdf5", //* 연한 초록색 배경
    border: "#10b981", //* 초록색 테두리
    text: "#065f46", //* 진한 초록색 텍스트
    hover: "#d1fae5", //* 호버 시 더 진한 초록색
  },
  JOB: {
    bg: "#dbeafe", //* 연한 파란색 배경
    border: "#3b82f6", //* 파란색 테두리
    text: "#1e40af", //* 진한 파란색 텍스트
    hover: "#bfdbfe", //* 호버 시 더 진한 파란색
  },
  STEP: {
    bg: "#fef3c7", //* 기본 노란색 배경 (카테고리별로 동적 변경)
    border: "#f59e0b", //* 기본 노란색 테두리 (카테고리별로 동적 변경)
    text: "#92400e", //* 기본 진한 노란색 텍스트 (카테고리별로 동적 변경)
    hover: "#fde68a", //* 기본 호버 색상 (카테고리별로 동적 변경)
  },
  STEPS: {
    bg: "#fef3c7", //* 연한 노란색 배경
    border: "#f59e0b", //* 노란색 테두리
    text: "#92400e", //* 진한 노란색 텍스트
    hover: "#fde68a", //* 호버 시 더 진한 노란색
  },
} as const;

//* ========================================
//* 노드 아이콘 상수
//* ========================================

//* 각 노드 타입별 아이콘 정의 - 더 현대적인 아이콘 사용
export const getNodeIcon = (nodeType: NodeType): React.ReactNode => {
  switch (nodeType) {
    case "TRIGGER":
      return <Zap size={18} className="text-emerald-600" />;
    case "JOB":
      return <Settings size={18} className="text-blue-600" />;
    case "STEP":
      return <Code size={18} className="text-amber-600" />;
    case "STEPS":
      return <Layers size={18} className="text-amber-600" />;
    default:
      return <Package size={18} />;
  }
};

//* ========================================
//* 노드 핸들 설정 상수
//* ========================================

//* 각 노드 타입별 연결점(핸들) 설정
export const NODE_HANDLE_CONFIGS = {
  TRIGGER: [
    {
      type: "source" as const,
      position: Position.Bottom,
      className: "reactflow-handle",
      style: { background: "#10b981" },
    },
  ],
  JOB: [
    {
      type: "target" as const,
      position: Position.Top,
      className: "reactflow-handle",
      style: { background: "#3b82f6" },
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      className: "reactflow-handle",
      style: { background: "#3b82f6" },
    },
    {
      type: "source" as const,
      position: Position.Right,
      className: "reactflow-handle job-connection",
      style: {
        background: "#3b82f6",
        right: -4,
        top: "50%",
        transform: "translateY(-50%)",
      },
    },
  ],
  STEP: [
    {
      type: "target" as const,
      position: Position.Top,
      className: "reactflow-handle",
      style: { top: -4, background: "#f59e0b" },
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      className: "reactflow-handle",
      style: { bottom: -4, background: "#f59e0b" },
    },
    {
      type: "target" as const,
      position: Position.Left,
      className: "reactflow-handle job-connection",
      style: {
        left: -4,
        top: "50%",
        transform: "translateY(-50%)",
        background: "#f59e0b",
      },
    },
  ],
  STEPS: [
    {
      type: "target" as const,
      position: Position.Top,
      style: { background: "#f59e0b" },
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      style: { background: "#f59e0b" },
    },
  ],
} as const;

//* ========================================
//* 카테고리별 색상 상수
//* ========================================

//* 도메인별 색상 정의 (Step 블록 전용)
export const DOMAIN_COLORS = {
  github: {
    bg: "#dbeafe",
    border: "#3b82f6",
    text: "#1e40af",
    hover: "#bfdbfe",
  },
  java: {
    bg: "#fef3c7",
    border: "#f59e0b",
    text: "#92400e",
    hover: "#fde68a",
  },
  gradle: {
    bg: "#fce7f3",
    border: "#ec4899",
    text: "#be185d",
    hover: "#fbcfe8",
  },
  docker: {
    bg: "#e0e7ff",
    border: "#6366f1",
    text: "#3730a3",
    hover: "#c7d2fe",
  },
  aws: {
    bg: "#fef2f2",
    border: "#f97316",
    text: "#9a3412",
    hover: "#fed7aa",
  },
} as const;

//* 새로운 도메인용 색상 팔레트 (충돌 방지)
const COLOR_PALETTE = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", hover: "#bfdbfe" }, //* 파랑
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", hover: "#fde68a" }, //* 노랑
  { bg: "#fce7f3", border: "#ec4899", text: "#be185d", hover: "#fbcfe8" }, //* 분홍
  { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3", hover: "#c7d2fe" }, //* 보라
  { bg: "#fef2f2", border: "#f97316", text: "#9a3412", hover: "#fed7aa" }, //* 주황
  { bg: "#ecfdf5", border: "#10b981", text: "#065f46", hover: "#d1fae5" }, //* 초록
  { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", hover: "#fecaca" }, //* 빨강
  { bg: "#f0f9ff", border: "#0ea5e9", text: "#0c4a6e", hover: "#bae6fd" }, //* 하늘
  { bg: "#fdf4ff", border: "#a855f7", text: "#581c87", hover: "#f3e8ff" }, //* 보라
  { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", hover: "#fef3c7" }, //* 주황
] as const;

//* ========================================
//* 카테고리별 아이콘 상수
//* ========================================

//* 각 카테고리별 아이콘 정의
export const CATEGORY_ICONS = {
  workflow: <Settings size={16} />,
  setup: <Database size={16} />,
  build: <Code size={16} />,
  test: <Play size={16} />,
  deploy: <Server size={16} />,
  docker: <Cloud size={16} />,
} as const;

//* ========================================
//* 노드 타입별 CSS 클래스 상수
//* ========================================

//* 각 노드 타입별 Tailwind CSS 클래스 정의
export const NODE_TYPE_CLASSES: Record<NodeType, string> = {
  TRIGGER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  JOB: "bg-blue-100 text-blue-800 border-blue-200",
  STEP: "bg-amber-100 text-amber-800 border-amber-200",
  STEPS: "bg-amber-100 text-amber-800 border-amber-200",
} as const;

//* ========================================
//* 유틸리티 함수
//* ========================================

//* 해시 기반 색상 생성 함수
const generateColorFromHash = (domain: string) => {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

//* 도메인별 색상 가져오기 함수
export const getDomainColor = (domain: string) => {
  //* 미리 정의된 도메인은 고정 색상 사용
  if (DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS]) {
    return DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS];
  }

  //* 새로운 도메인은 해시 기반 색상 할당
  return generateColorFromHash(domain);
};

//* 기존 호환성을 위한 함수 (deprecated)
export const getCategoryColor = (category: string) => {
  return getDomainColor(category);
};

//* 노드 타입별 색상 가져오기 함수
export const getNodeColor = (nodeType: NodeType, category?: string) => {
  if (nodeType === "STEP" && category) {
    //* Step 노드의 경우 도메인별 색상 적용
    return getDomainColor(category);
  }
  return NODE_COLORS[nodeType];
};

//* 노드 타입별 핸들 설정 가져오기 함수
export const getNodeHandles = (nodeType: NodeType) => {
  return NODE_HANDLE_CONFIGS[nodeType];
};

//* 카테고리별 아이콘 가져오기 함수
export const getCategoryIcon = (category: string) => {
  return (
    CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || (
      <Package size={16} />
    )
  );
};
