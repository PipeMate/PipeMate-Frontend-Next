// * Workflow 관련 타입 정의

// * GitHub Workflow 아이템 타입
export interface WorkflowItem {
  // * 워크플로우 ID
  id: number;
  // * 워크플로우 이름
  name: string;
  // * 워크플로우 파일 경로
  path: string;
  // * 워크플로우 상태
  state: string;
  // * 생성 시간
  createdAt: string;
  // * 수정 시간
  updatedAt: string;
  // * API URL
  url: string;
  // * HTML URL
  htmlUrl: string;
  // * 배지 URL
  badgeUrl: string;
  // * 수동 실행 가능 여부
  manualDispatchEnabled: boolean;
  // * 사용 가능한 브랜치 목록
  availableBranches: string[];
  // * 파일명
  fileName: string;
}

// * GitHub Job 상세 응답 타입
export interface GithubJobDetailResponse {
  // * Job ID
  id: number;
  // * Job 이름
  name: string;
  // * Job 상태
  status: string;
  // * Job 결론
  conclusion: string;
  // * Job 단계 목록
  steps: {
    // * 단계 이름
    name: string;
    // * 단계 상태
    status: string;
    // * 단계 결론
    conclusion: string;
    // * 시작 시간
    startedAt: string;
    // * 완료 시간
    completedAt: string;
  }[];
}
