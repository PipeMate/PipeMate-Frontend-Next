// 이 파일은 상세 설정 타입(Trigger/Job/Step)만 정의합니다.
// 노드와 워크플로우 노드 데이터 타입은 `../types` 및 `../../types`를 사용하세요.

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
