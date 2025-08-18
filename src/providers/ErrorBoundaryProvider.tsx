'use client';

// * Error Boundary Provider
// * - 전역 에러 처리 및 복구
// * - 타입 안전성 보장
// * - 사용자 친화적인 에러 메시지
import type { ErrorInfo } from 'react';
import React, { Component } from 'react';
import type { ProviderProps } from './types';

// * 에러 상태 인터페이스
interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// * 에러 메시지 상수
const ERROR_MESSAGES = {
  DEFAULT: '알 수 없는 오류가 발생했습니다.',
  NETWORK: '네트워크 연결에 문제가 있습니다.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
} as const;

// * 에러 타입별 메시지 매핑
const getErrorMessage = (error: Error): string => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK;
  }
  if (message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return ERROR_MESSAGES.FORBIDDEN;
  }
  if (message.includes('not found') || message.includes('404')) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  if (message.includes('server') || message.includes('500')) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  return ERROR_MESSAGES.DEFAULT;
};

// * Error Boundary 컴포넌트
class ErrorBoundary extends Component<ProviderProps, ErrorState> {
  constructor(props: ProviderProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (개발 환경에서만 상세 정보 출력)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    } else {
      // 프로덕션 환경에서는 에러 추적 서비스로 전송
      console.error('Application error:', error.message);
    }

    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error
        ? getErrorMessage(this.state.error)
        : ERROR_MESSAGES.DEFAULT;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                오류가 발생했습니다
              </h3>

              <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  페이지 새로고침
                </button>
              </div>

              {/* 개발 환경에서만 상세 에러 정보 표시 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-600 cursor-pointer">
                    상세 에러 정보
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// * ErrorBoundaryProvider
// * - 전역 에러 처리 래퍼
// * - 사용자 친화적인 에러 UI 제공
export default function ErrorBoundaryProvider({ children }: ProviderProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
