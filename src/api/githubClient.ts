/**
 * GitHub API 전용 axios 클라이언트
 * - 요청 시 쿠키에 저장된 GitHub Token을 Authorization 헤더로 주입합니다.
 * - 백엔드 게이트웨이를 통해 GitHub API를 호출합니다.
 */
import axios from 'axios';
import { STORAGES } from '@/config/appConstants';
import { getCookie } from '@/lib/cookieUtils';

// * GitHub 전용 클라이언트 (GitHub Personal Access Token 포함)
// - NEXT_PUBLIC_API_URL이 없으면 동일 오리진 상대 경로(리라이트 적용)
const githubClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

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
  (error) => Promise.reject(error),
);

// * API 모듈들 import
export { pipelineAPI } from './pipeline';
export { workflowAPI } from './workflow';
export { secretsAPI } from './secrets';
export { blockAPI } from './blocks';

// * API Hooks export
export * from './hooks';

// * 타입들 export
export * from './types';

export default githubClient;
