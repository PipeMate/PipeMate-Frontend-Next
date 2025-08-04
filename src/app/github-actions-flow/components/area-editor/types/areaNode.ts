import { NodeType } from "./index";

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
}
