import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  // *  스피너 크기
  size?: 'sm' | 'md' | 'lg';
  // *  로딩 메시지
  message?: string;
  // *  추가 클래스명
  className?: string;
  // *  전체 컨테이너 클래스명
  containerClassName?: string;
}

// * 로딩 스피너 컴포넌트
// * - 다양한 크기와 메시지를 지원합니다.
// * - 일관된 로딩 UI를 제공합니다.
export function LoadingSpinner({
  size = 'md',
  message,
  className,
  containerClassName,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', containerClassName)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-200 border-t-gray-600',
          sizeClasses[size],
          className,
        )}
      />
      {message && <p className="mt-3 text-sm text-gray-600 text-center">{message}</p>}
    </div>
  );
}

// * 전체 화면 로딩 컴포넌트
export function FullScreenLoading({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-gray-600 mx-auto" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// * 인라인 로딩 스피너 (텍스트와 함께 표시)
export function InlineLoadingSpinner({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-gray-600" />
      <span>{message}</span>
    </div>
  );
}
