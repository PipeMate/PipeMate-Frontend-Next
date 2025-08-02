import axios from "axios";

// * Next.js API 라우트를 사용하도록 상대 경로로 설정
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// * 기본 axios 인스턴스
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초로 증가
  headers: { "Content-Type": "application/json" },
});

// * 응답 인터셉터 추가 - 네트워크 오류 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.warn(
        "네트워크 오류 발생 - 백엔드 서버가 실행되지 않았을 수 있습니다."
      );
      console.warn("API URL:", BASE_URL);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
