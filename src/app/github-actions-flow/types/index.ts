//* ========================================
//* GitHub Actions Flow 타입 정의
//* ========================================
//* 이 파일은 React Flow 기반 GitHub Actions 워크플로우 에디터의
//* 모든 타입 정의를 포함합니다.

import { Node, Edge } from "reactflow";

//* ========================================
//* 서버 통신 타입
//* ========================================

//* 서버와 통신하는 블록 데이터 형식
//? 서버에서 받고 보내는 데이터의 표준 형식
export interface ServerBlock {
  name: string; //* 블록 이름
  type: "trigger" | "job" | "step"; //* 블록 타입
  category: string; //* 블록 카테고리
  description: string; //* 블록 설명
  "job-name"?: string; //* Job/Step 타입일 때 - Job 이름
  config: Record<string, unknown>; //* 블록 설정 데이터
}

//* ========================================
//* 워크플로우 구성 요소 타입
//* ========================================

//* 워크플로우 트리거 설정
export interface WorkflowTrigger {
  type: "push" | "pull_request" | "schedule" | "workflow_dispatch";
  branches?: string[];
  paths?: string[];
  cron?: string;
}

//* Job 설정
export interface JobConfig {
  name: string;
  runsOn: string;
  needs?: string[];
  if?: string;
  timeout?: number;
  steps?: StepConfig[];
}

//* Step 설정
export interface StepConfig {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
  if?: string;
  continueOnError?: boolean;
}

//* ========================================
//* React Flow 노드 데이터 타입
//* ========================================

//* React Flow 노드의 데이터 구조
export interface WorkflowNodeData {
  label: string; //* 노드 표시 이름
  type: "workflow_trigger" | "job" | "step"; //* 노드 타입
  category: string; //* 노드 카테고리
  description: string; //* 노드 설명
  config: Record<string, unknown>; //* 노드 설정 데이터
  parentId?: string; //* 부모 노드 ID (Step용)
  jobName?: string; //* Job 이름 (Step용)
}

//* ========================================
//* 컴포넌트 Props 타입
//* ========================================

//* React Flow 워크스페이스 Props
export interface ReactFlowWorkspaceProps {
  onWorkflowChange: (blocks: ServerBlock[]) => void; //* 워크플로우 변경 콜백
  initialBlocks?: ServerBlock[]; //* 초기 블록 데이터
}

//* ========================================
//* 유틸리티 타입
//* ========================================

//* 노드 템플릿 타입
export interface NodeTemplate {
  id: string;
  type: "workflow_trigger" | "job" | "step";
  data: WorkflowNodeData;
  position: { x: number; y: number };
  parentNode?: string;
}

//* 워크플로우 생성 함수 타입
export type WorkflowGenerator = (nodes: Node[], edges: Edge[]) => ServerBlock[];

//* 노드 생성 함수 타입
export type NodeCreator = (
  type: string,
  position: { x: number; y: number },
  parentId?: string
) => Node;
