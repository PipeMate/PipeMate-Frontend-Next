import axios from "axios";

// * Next.js API 라우트를 사용하도록 상대 경로로 설정
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// * 기본 axios 인스턴스 (인터셉터 없음)
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초로 증가
  headers: { "Content-Type": "application/json" },
});

export default apiClient;
