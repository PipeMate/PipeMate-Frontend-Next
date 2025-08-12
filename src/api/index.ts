/**
 * API 기본 클라이언트
 * - 앱 전역에서 공통으로 사용하는 axios 인스턴스를 정의합니다.
 * - baseURL은 환경과 설정에 따라 `apiConfig`를 우선 활용합니다.
 */
import axios from 'axios';
import { API_CONFIG } from '@/config/apiConfig';

// * 기본 API 클라이언트 설정
// - 개발(default): 동일 오리진 상대 경로(Next.js rewrite 적용)
// - 운영/실서비스(또는 강제 플래그): 백엔드 절대 경로 사용
// - 레거시 호환: NEXT_PUBLIC_API_URL이 있으면 우선 사용
const BASE_URL = API_CONFIG.USE_REAL_API
  ? process.env.NEXT_PUBLIC_API_URL ?? API_CONFIG.BASE_URL
  : '';

// * 기본 axios 인스턴스 (인터셉터 없음)
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;

// * API 배럴 export
export { default as githubClient } from './githubClient';
export { pipelineAPI } from './pipeline';
export { workflowAPI } from './workflow';
export { secretsAPI } from './secrets';
export { blockAPI } from './blocks';

// * Hooks, Types 재노출
export * from './hooks';
export * from './types';
