// * GitHub API 전용 axios 클라이언트
// * - 요청 시 쿠키에 저장된 GitHub Token을 Authorization 헤더로 주입
import axios from 'axios';
import { getCookie } from '@/lib/cookieUtils';
import { API_CONFIG, STORAGES } from '@/config';

// * GitHub API 전용 axios 인스턴스
const githubClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
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
