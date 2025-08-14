import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  // *  상태 값 
  status: string;
  // *  배지 크기 
  size?: 'sm' | 'md';
  // *  추가 클래스명 
  className?: string;
}

// * 상태 배지 컴포넌트
// * - GitHub 워크플로우 상태에 맞는 색상과 스타일을 적용합니다.
// * - 일관된 상태 표시를 제공합니다.
export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const statusConfig = {
    // 성공 상태
    success: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    completed: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-200',
    },

    // 실패 상태
    failure: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    cancelled: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    timed_out: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-200',
    },

    // 진행 중 상태
    in_progress: {
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    queued: {
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    requested: {
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    waiting: {
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },

    // 중립 상태
    neutral: {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    skipped: {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    stale: {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },

    // 액션 필요
    action_required: {
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn('font-medium border', config.className, sizeClasses[size], className)}
    >
      {status.replace('_', ' ')}
    </Badge>
  );
}

// * 워크플로우 상태 배지
export function WorkflowStatusBadge({ status, ...props }: StatusBadgeProps) {
  return <StatusBadge status={status} {...props} />;
}

// * Job 상태 배지
export function JobStatusBadge({ status, ...props }: StatusBadgeProps) {
  return <StatusBadge status={status} {...props} />;
}
