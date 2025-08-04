import { NodeType } from "../types";

export interface AreaNodeProps {
  node: AreaNodeData;
  onSelect: (node: AreaNodeData) => void;
  onDragStart: (node: AreaNodeData) => void;
  onDrag: (e: React.DragEvent, node: AreaNodeData) => void;
}

export interface AreaNodeData {
  id: string;
  type: NodeType;
  data: WorkflowNodeData;
  order: number;
  parentId?: string;
  isSelected: boolean;
  isEditing: boolean;
}

export interface WorkflowNodeData {
  label: string;
  type: "workflow_trigger" | "job" | "step";
  description: string;
  jobName: string;
  domain: string;
  task: string[];
  config: Record<string, unknown>;
}

export interface TriggerConfig {
  triggers: string[];
  branches: string[];
  paths: string[];
  workflowName: string;
}

export interface JobConfig {
  runsOn: string[];
  needs: string[];
  timeout: string[];
  conditions: string[];
}

export interface StepConfig {
  uses: string[];
  run: string[];
  withParams: Record<string, unknown>;
  name?: string;
  env?: Record<string, string>;
  continueOnError?: boolean;
  if?: string;
  workingDirectory?: string;
  shell?: string;
}

//* Step의 상세 config 정보를 위한 타입
export interface StepConfigDetail {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
  continueOnError?: boolean;
  if?: string;
  workingDirectory?: string;
  shell?: string;
}
