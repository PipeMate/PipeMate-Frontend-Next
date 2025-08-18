import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Info, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  // *  아이콘
  icon?: LucideIcon;
  // *  제목
  title: string;
  // *  설명
  description?: string;
  // *  액션 버튼
  action?: React.ReactNode;
  // *  추가 클래스명
  className?: string;
  // *  아이콘 크기
  iconSize?: 'sm' | 'md' | 'lg';
}

// * 빈 상태 컴포넌트
// * - 데이터가 없거나 로드되지 않았을 때 표시됩니다.
// * - 일관된 빈 상태 UI를 제공합니다.
export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
  iconSize = 'md',
}: EmptyStateProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('text-center py-8', className)}>
      <Icon className={cn('mx-auto text-gray-400', iconSizes[iconSize])} />
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// * 설정 안내 빈 상태
export function SetupRequiredEmptyState({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="설정이 필요합니다"
      description="이 기능을 사용하려면 먼저 설정을 완료해주세요."
      action={action}
    />
  );
}

// * 정보 안내 빈 상태
export function InfoEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyState icon={Info} title={title} description={description} action={action} />
  );
}
