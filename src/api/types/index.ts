// * API 관련 타입 정의 모음
// * - 백엔드 API와의 통신에 사용되는 모든 타입들을 정의합니다.
// * - 요청/응답 타입, 엔티티 타입, 유틸리티 타입 등을 포함합니다.

// ============================================================================
// * Pipeline 관련 타입
// ============================================================================

// * 파이프라인 생성/수정 요청 타입
export interface PipelineRequest {
  // *  GitHub 소유자 
  owner: string;
  // *  GitHub 리포지토리 
  repo: string;
  // *  워크플로우 파일명 
  workflowName: string;
  // *  워크플로우를 구성하는 블록들의 원본 JSON 배열 
  inputJson: unknown[];
  // *  파이프라인 설명 (선택사항) 
  description?: string;
}

// * 파이프라인 응답 타입
export interface PipelineResponse {
  // *  파이프라인 ID 
  workflowId: string;
  // *  GitHub 소유자 
  owner: string;
  // *  GitHub 리포지토리 
  repo: string;
  // *  워크플로우 파일명 
  workflowName: string;
  // *  원본 JSON 데이터 
  originalJson: Record<string, unknown>[];
  // *  변환된 JSON 데이터 
  convertedJson: Record<string, unknown>;
  // *  YAML 내용 
  yamlContent: string;
  // *  GitHub 파일 경로 
  githubPath: string;
  // *  생성 시간 
  createdAt: string;
  // *  수정 시간 
  updatedAt: string;
  // *  성공 여부 
  success: boolean;
  // *  응답 메시지 
  message: string;
}

// ============================================================================
// * GitHub Workflow 관련 타입
// ============================================================================

// * GitHub 워크플로우 아이템 타입
export interface WorkflowItem {
  // *  워크플로우 ID 
  id: number;
  // *  워크플로우 이름 
  name: string;
  // *  워크플로우 파일 경로 
  path: string;
  // *  워크플로우 상태 
  state: string;
  // *  생성 시간 
  createdAt: string;
  // *  수정 시간 
  updatedAt: string;
  // *  API URL 
  url: string;
  // *  HTML URL 
  htmlUrl: string;
  // *  배지 URL 
  badgeUrl: string;
  // *  수동 실행 가능 여부 
  manualDispatchEnabled: boolean;
  // *  사용 가능한 브랜치 목록 
  availableBranches: string[];
  // *  파일명 
  fileName: string;
}

// * GitHub Job 상세 응답 타입
export interface GithubJobDetailResponse {
  // *  Job ID 
  id: number;
  // *  Job 이름 
  name: string;
  // *  Job 상태 
  status: string;
  // *  Job 결론 
  conclusion: string;
  // *  Job 단계 목록 
  steps: {
    // *  단계 이름 
    name: string;
    // *  단계 상태 
    status: string;
    // *  단계 결론 
    conclusion: string;
    // *  시작 시간 
    startedAt: string;
    // *  완료 시간 
    completedAt: string;
  }[];
}

// ============================================================================
// * GitHub Secrets 관련 타입
// ============================================================================

// * GitHub Secret 생성/수정 요청 타입
export interface GithubSecretRequest {
  // *  Secret 값 
  value: string;
}

// * GitHub Public Key 응답 타입
export interface GithubPublicKeyResponse {
  // *  Public Key 
  key: string;
  // *  Key ID 
  keyId: string;
}

// * GitHub Secret 목록 응답 타입
export interface GithubSecretListResponse {
  // *  전체 개수 
  totalCount: number;
  // *  Secret 목록 
  secrets: {
    // *  Secret 이름 
    name: string;
    // *  생성 시간 
    createdAt: string;
    // *  수정 시간 
    updatedAt: string;
  }[];
}

// * 그룹화된 GitHub Secret 목록 응답 타입
export interface GroupedGithubSecretListResponse {
  // *  그룹별 Secret 목록 
  groupedSecrets: {
    [key: string]: {
      // *  Secret 이름 
      name: string;
      // *  생성 시간 
      createdAt: string;
      // *  수정 시간 
      updatedAt: string;
    }[];
  };
}

// ============================================================================
// * Block 관련 타입
// ============================================================================

// * 블록 응답 타입
export interface BlockResponse {
  // *  블록 ID 
  id: number;
  // *  블록 이름 
  name: string;
  // *  블록 타입 
  type: 'trigger' | 'job' | 'step';
  // *  블록 설명 
  description?: string;
  // *  블록 설정 (백엔드 표준 필드) 
  config: Record<string, unknown>;
  // *  Job 이름 (job/step에서만 사용) 
  jobName?: string;
  // *  도메인 (step에서만 사용) 
  domain?: string;
  // *  작업 목록 (step에서만 사용) 
  task?: string[];
  // *  과거/목 데이터 호환 필드 
  content?: Record<string, unknown>;
  // *  생성 시간 
  createdAt?: string;
  // *  수정 시간 
  updatedAt?: string;
}
