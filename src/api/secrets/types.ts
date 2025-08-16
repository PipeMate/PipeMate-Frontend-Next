// * Secrets 관련 타입 정의

// * GitHub Secret 생성/수정 요청 타입
export interface GithubSecretRequest {
  // * Secret 값
  value: string;
}

// * GitHub Public Key 응답 타입
export interface GithubPublicKeyResponse {
  // * Public Key
  key: string;
  // * Key ID
  keyId: string;
}

// * GitHub Secret 목록 응답 타입
export interface GithubSecretListResponse {
  // * 전체 개수
  totalCount: number;
  // * Secret 목록
  secrets: {
    // * Secret 이름
    name: string;
    // * 생성 시간
    createdAt: string;
    // * 수정 시간
    updatedAt: string;
  }[];
}

// * 그룹화된 GitHub Secret 목록 응답 타입
export interface GroupedGithubSecretListResponse {
  // * 그룹별 Secret 목록
  groupedSecrets: {
    [key: string]: {
      // * Secret 이름
      name: string;
      // * 생성 시간
      createdAt: string;
      // * 수정 시간
      updatedAt: string;
    }[];
  };
}
