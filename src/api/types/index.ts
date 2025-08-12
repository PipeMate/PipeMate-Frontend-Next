// * 공통 타입 정의

export interface PipelineRequest {
  owner: string;
  repo: string;
  workflowName: string;
  // 워크플로우를 구성하는 블록들의 원본 JSON 배열
  // 송신 전용으로 엄격한 구조를 강제하지 않습니다
  inputJson: unknown[];
  description?: string;
}

export interface PipelineResponse {
  workflowId: string;
  owner: string;
  repo: string;
  workflowName: string;
  originalJson: Record<string, unknown>[];
  convertedJson: Record<string, unknown>;
  yamlContent: string;
  githubPath: string;
  createdAt: string;
  updatedAt: string;
  success: boolean;
  message: string;
}

export interface WorkflowItem {
  id: number;
  name: string;
  path: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  htmlUrl: string;
  badgeUrl: string;
  manualDispatchEnabled: boolean;
  availableBranches: string[];
  fileName: string;
}

export interface GithubJobDetailResponse {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  steps: {
    name: string;
    status: string;
    conclusion: string;
    startedAt: string;
    completedAt: string;
  }[];
}

export interface GithubSecretRequest {
  value: string;
}

export interface GithubPublicKeyResponse {
  key: string;
  keyId: string;
}

export interface GithubSecretListResponse {
  totalCount: number;
  secrets: {
    name: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface GroupedGithubSecretListResponse {
  groupedSecrets: {
    [key: string]: {
      name: string;
      createdAt: string;
      updatedAt: string;
    }[];
  };
}

export interface BlockResponse {
  id: number;
  name: string;
  type: 'trigger' | 'job' | 'step';
  description?: string;
  // 백엔드 BlockResponse 표준 필드
  config: Record<string, unknown>;
  jobName?: string; // job/step에서만
  domain?: string; // step에서만
  task?: string[]; // step에서만
  // 과거/목 데이터 호환 필드 (있을 수도 있음)
  content?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
