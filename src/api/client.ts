// * 기본 API 클라이언트
// * - 모든 API 호출의 기본이 되는 axios 인스턴스
import axios from 'axios';
import { API_CONFIG } from '@/config';

// * 기본 axios 인스턴스
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
