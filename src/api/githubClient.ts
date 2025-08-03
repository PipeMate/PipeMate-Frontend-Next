import apiClient from "@/api";
import { STORAGES } from "@/config/appConstants";
import { getCookie } from "@/lib/cookieUtils";

// * GitHub 전용 클라이언트 (GitHub Personal Access Token 포함)
// ? 백엔드 서버로 직접 요청하도록 설정
const githubClient = apiClient.create();

// * 토큰 인터셉터
githubClient.interceptors.request.use(
  (config) => {
    // * 쿠키에서 GitHub Personal Access Token 가져오기
    const savedGithubToken = getCookie(STORAGES.GITHUB_TOKEN);
    if (savedGithubToken) {
      // * GitHub API는 Bearer 토큰 형식을 요구합니다
      config.headers.Authorization = `Bearer ${savedGithubToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// * API 모듈들 import
export { pipelineAPI } from "./pipeline";
export { workflowAPI } from "./workflow";
export { secretsAPI } from "./secrets";
export { blockAPI } from "./blocks";

// * API Hooks export
export * from "./hooks";

// * 타입들 export
export * from "./types";

export default githubClient;
