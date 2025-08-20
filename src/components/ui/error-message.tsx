import React from 'react';
import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  // * 에러 메시지
  message: string;
  // * 에러 타입
  variant?: 'error' | 'warning' | 'info';
  // * 아이콘 표시 여부
  showIcon?: boolean;
  // * 추가 클래스명
  className?: string;
  // * 재시도 함수
  onRetry?: () => void;
}

// * 에러 메시지 컴포넌트
// * - 다양한 에러 타입을 지원합니다.
// * - 재시도 기능을 포함할 수 있습니다.
export function ErrorMessage({
  message,
  variant = 'error',
  showIcon = true,
  className,
  onRetry,
}: ErrorMessageProps) {
  const variantStyles = {
    error: {
      container: 'border-red-200 bg-red-50 text-red-800',
      icon: 'text-red-600',
      iconComponent: XCircle,
    },
    warning: {
      container: 'border-orange-200 bg-orange-50 text-orange-800',
      icon: 'text-orange-600',
      iconComponent: AlertTriangle,
    },
    info: {
      container: 'border-blue-200 bg-blue-50 text-blue-800',
      icon: 'text-blue-600',
      iconComponent: AlertCircle,
    },
  };

  const IconComponent = variantStyles[variant].iconComponent;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        variantStyles[variant].container,
        className,
      )}
    >
      {showIcon && (
        <IconComponent
          className={cn('w-5 h-5 mt-0.5 flex-shrink-0', variantStyles[variant].icon)}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs underline hover:no-underline">
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}

// * 간단한 에러 메시지 (인라인)
export function InlineErrorMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return <div className={cn('text-red-600 text-sm', className)}>{message}</div>;
}
