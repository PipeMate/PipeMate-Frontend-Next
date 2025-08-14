// * GitHub API 전용 axios 클라이언트
// * - 요청 시 쿠키에 저장된 GitHub Token을 Authorization 헤더로 주입합니다.
// * - 백엔드 게이트웨이를 통해 GitHub API를 호출합니다.
import axios from 'axios';
import { STORAGES } from '@/config/appConstants';
import { getCookie } from '@/lib/cookieUtils';
import { API_CONFIG } from '@/config/apiConfig';

// * GitHub 전용 클라이언트 (GitHub Personal Access Token 포함)
// - 개발(default): 동일 오리진 상대 경로(Next.js rewrite 적용)
// - 운영/실서비스(또는 강제 플래그): 백엔드 절대 경로 사용
// - 레거시 호환: NEXT_PUBLIC_API_URL이 있으면 우선 사용
const githubBaseUrl = API_CONFIG.USE_REAL_API
  ? process.env.NEXT_PUBLIC_API_URL ?? API_CONFIG.BASE_URL
  : '';

// * GitHub API 전용 axios 인스턴스
// * - GitHub Personal Access Token을 자동으로 주입합니다.
// * - 백엔드 게이트웨이를 통해 GitHub API를 호출합니다.
const githubClient = axios.create({
  baseURL: githubBaseUrl,
  timeout: API_CONFIG.TIMEOUT,
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
    } else {
      console.warn('⚠️ GitHub 토큰이 설정되지 않았습니다.');
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default githubClient;
