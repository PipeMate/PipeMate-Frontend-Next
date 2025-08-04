import { ServerBlock, WorkflowNodeData } from "../../types";

/**
 * ========================================
 * 타입 정의
 * ========================================
 */

//* 노드 타입 정의
export type NodeType = "workflowTrigger" | "job" | "step";

//* 영역별 노드 데이터
export interface AreaNodeData {
  id: string;
  type: NodeType;
  data: WorkflowNodeData;
  order: number; //* 영역 내 순서
  parentId?: string; //* 부모 Job의 ID (Step의 경우)
  isSelected?: boolean;
  isEditing?: boolean;
}

//* 워크플로우 에디터 Props
export interface AreaBasedWorkflowEditorProps {
  onWorkflowChange?: (blocks: ServerBlock[]) => void;
  initialBlocks?: ServerBlock[];
  onNodeSelect?: (block: ServerBlock | undefined) => void;
  onEditModeToggle?: () => void;
  isEditing?: boolean;
}

//* 영역별 노드 상태
export interface AreaNodes {
  trigger: AreaNodeData[];
  job: AreaNodeData[];
  step: AreaNodeData[];
}
