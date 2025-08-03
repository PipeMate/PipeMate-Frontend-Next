// * 공통 타입 정의

export interface PipelineRequest {
  owner: string;
  repo: string;
  workflowName: string;
  inputJson: Record<string, unknown>[];
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
  type: string;
  description?: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
