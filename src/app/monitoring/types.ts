// * 모니터링 페이지 타입 정의
// * - 워크플로우 실행 관련 모든 타입들을 정의합니다.

// ============================================================================
// * Workflow Run 관련 타입
// ============================================================================

// * 워크플로우 실행 타입
export interface WorkflowRun {
  // * 실행 ID
  id: number;
  // * 워크플로우 이름
  name: string;
  // * 실행 상태
  status: string;
  // * 실행 결론
  conclusion?: string;
  // * 생성 시간
  created_at: string;
  // * 수정 시간
  updated_at: string;
  // * 실행 번호
  run_number: number;
  // * 워크플로우 ID
  workflow_id: number;
  // * 헤드 브랜치
  head_branch?: string;
  // * 헤드 커밋 SHA
  head_sha?: string;
  // * 이벤트 타입
  event?: string;
  // * 표시 제목
  display_title?: string;
}

// * 워크플로우 실행 상세 정보 타입
export interface WorkflowRunDetail {
  // * 실행 ID
  id: number;
  // * 워크플로우 이름
  name: string;
  // * 노드 ID
  node_id: string;
  // * 체크 스위트 ID
  check_suite_id: number;
  // * 체크 스위트 노드 ID
  check_suite_node_id: string;
  // * 헤드 브랜치
  head_branch: string;
  // * 헤드 커밋 SHA
  head_sha: string;
  // * 워크플로우 파일 경로
  path: string;
  // * 실행 번호
  run_number: number;
  // * 이벤트 타입
  event: string;
  // * 표시 제목
  display_title: string;
  // * 실행 상태
  status: string;
  // * 실행 결론
  conclusion?: string;
  // * 워크플로우 ID
  workflow_id: number;
  // * API URL
  url: string;
  // * HTML URL
  html_url: string;
  // * 생성 시간
  created_at: string;
  // * 수정 시간
  updated_at: string;
}

// ============================================================================
// * Job 관련 타입
// ============================================================================

// * Job 단계 타입
export interface JobStep {
  // * 단계 이름
  name: string;
  // * 단계 상태
  status: string;
  // * 단계 결론
  conclusion?: string;
  // * 시작 시간
  startedAt?: string;
  // * 완료 시간
  completedAt?: string;
}

// * Job 상세 정보 타입
export interface JobDetail {
  // * Job ID
  id: number;
  // * Job 이름
  name: string;
  // * Job 상태
  status: string;
  // * Job 결론
  conclusion?: string;
  // * 시작 시간
  startedAt?: string;
  // * 완료 시간
  completedAt?: string;
  // * Job 단계 목록
  steps: JobStep[];
}

// ============================================================================
// * 통계 관련 타입
// ============================================================================

// * 실행 통계 타입
export interface RunStatistics {
  // * 전체 Job 수
  totalJobs: number;
  // * 전체 Step 수
  totalSteps: number;
  // * 성공한 Step 수
  successSteps: number;
  // * 실패한 Step 수
  failedSteps: number;
  // * 스킵된 Step 수
  skippedSteps: number;
}

// ============================================================================
// * UI 상태 관련 타입
// ============================================================================

// * 활성 탭 타입
export type ActiveTab = 'execution' | 'details';

// * 반응형 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
