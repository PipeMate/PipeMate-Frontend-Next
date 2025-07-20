//* GitHub Actions Flow 관련 타입 정의 (Blockly 기반)

//? 블록 템플릿 타입 정의
export interface BlockTemplate {
  name: string;
  type: "trigger" | "job" | "step";
  category:
    | "workflow"
    | "source"
    | "setup"
    | "build"
    | "test"
    | "docker"
    | "deploy";
  description: string;
  template: Record<string, unknown>;
}

//* 워크플로우 트리거 타입
export interface WorkflowTrigger {
  name: string;
  on: {
    push?: { branches: string[] };
    pull_request?: { branches: string[] };
    workflow_dispatch?: Record<string, unknown>;
  };
}

//* Job 설정 타입
export interface JobConfig {
  jobName: string;
  runsOn: string;
}

//* Step 설정 타입
export interface StepConfig {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}

//* 생성된 워크플로우 타입
export interface GeneratedWorkflow {
  name: string;
  on: Record<string, unknown>;
  jobs: Record<
    string,
    {
      "runs-on": string;
      steps: StepConfig[];
    }
  >;
}

//* 컨트롤 버튼 props 타입
export interface ControlButtonsProps {
  onAddExample: () => void;
  onClear: () => void;
  onAutoArrange: () => void;
}

//* 블록 팔레트 props 타입
export interface BlockPaletteProps {
  onAddBlock: (template: BlockTemplate) => void;
  onAddExample: () => void;
  onClear: () => void;
  onAutoArrange: () => void;
}

//* YAML 패널 props 타입
export interface YamlPanelProps {
  generatedYaml: string;
}

//* Blockly 워크스페이스 props 타입
export interface BlocklyWorkspaceProps {
  onWorkspaceChange: (workspace: any) => void;
  initialXml?: string;
}

//* Blockly 블록 정의 타입
export interface BlocklyBlockDefinition {
  type: string;
  message0: string;
  args0?: Array<{
    type: string;
    name: string;
    text?: string;
    options?: Array<[string, string]>;
  }>;
  previousStatement?: string | null;
  nextStatement?: string | null;
  colour?: number;
  tooltip?: string;
  helpUrl?: string;
  mutator?: string;
  style?: string;
}

//* Blockly 카테고리 정의 타입
export interface BlocklyCategoryDefinition {
  name: string;
  colour: number;
  blocks: BlocklyBlockDefinition[];
}
