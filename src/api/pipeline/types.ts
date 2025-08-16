// * Pipeline 관련 타입 정의

// * 파이프라인 요청 타입
export interface PipelineRequest {
  // * GitHub 소유자
  owner: string;
  // * GitHub 리포지토리
  repo: string;
  // * 워크플로우 파일명
  workflowName: string;
  // * 워크플로우를 구성하는 블록들의 원본 JSON 배열
  inputJson: unknown[];
  // * 파이프라인 설명 (선택사항)
  description?: string;
}

// * 파이프라인 응답 타입
export interface PipelineResponse {
  // * 파이프라인 ID
  workflowId: string;
  // * GitHub 소유자
  owner: string;
  // * GitHub 리포지토리
  repo: string;
  // * 워크플로우 파일명
  workflowName: string;
  // * 원본 JSON 데이터
  originalJson: Record<string, unknown>[];
  // * 변환된 JSON 데이터
  convertedJson: Record<string, unknown>;
  // * YAML 내용
  yamlContent: string;
  // * GitHub 파일 경로
  githubPath: string;
  // * 생성 시간
  createdAt: string;
  // * 수정 시간
  updatedAt: string;
  // * 성공 여부
  success: boolean;
  // * 응답 메시지
  message: string;
}
