/**
 * API 기본 클라이언트
 * - 앱 전역에서 공통으로 사용하는 axios 인스턴스를 정의합니다.
 * - baseURL은 `NEXT_PUBLIC_API_URL`이 설정되지 않으면 동일 오리진을 사용합니다.
 */
import axios from 'axios';

// * 기본 API 클라이언트 설정
// - NEXT_PUBLIC_API_URL이 설정되지 않은 경우 동일 오리진 상대 경로(리라이트 적용)로 호출
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

// * 기본 axios 인스턴스 (인터셉터 없음)
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초로 증가
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
