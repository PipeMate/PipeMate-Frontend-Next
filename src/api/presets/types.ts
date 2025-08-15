// * Presets 관련 타입 정의

// * 블록 응답 타입
export interface BlockResponse {
  // * 블록 ID
  id: number;
  // * 블록 이름
  name: string;
  // * 블록 타입
  type: 'trigger' | 'job' | 'step';
  // * 블록 설명
  description?: string;
  // * 블록 설정 (백엔드 표준 필드)
  config: Record<string, unknown>;
  // * Job 이름 (job/step에서만 사용)
  jobName?: string;
  // * 도메인 (step에서만 사용)
  domain?: string;
  // * 작업 목록 (step에서만 사용)
  task?: string[];
  // * 과거/목 데이터 호환 필드
  content?: Record<string, unknown>;
  // * 생성 시간
  createdAt?: string;
  // * 수정 시간
  updatedAt?: string;
}
