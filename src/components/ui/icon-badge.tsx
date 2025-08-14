import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IconBadgeProps {
  // *  아이콘
  icon: React.ReactNode;
  // *  배지 텍스트
  children: React.ReactNode;
  // *  배지 변형
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  // *  배지 크기
  size?: 'sm' | 'md';
  // *  추가 클래스명
  className?: string;
  // *  아이콘 클래스명
  iconClassName?: string;
}

// * 아이콘과 배지 조합 컴포넌트
// * - 아이콘과 텍스트를 함께 표시하는 배지를 제공합니다.
// * - 일관된 아이콘 배지 UI를 제공합니다.
export function IconBadge({
  icon,
  children,
  variant = 'default',
  size = 'md',
  className,
  iconClassName,
}: IconBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  return (
    <Badge
      variant={variant}
      className={cn('inline-flex items-center font-medium', sizeClasses[size], className)}
    >
      <span className={cn('flex-shrink-0', iconClassName)}>{icon}</span>
      <span>{children}</span>
    </Badge>
  );
}

// * 탭 아이콘 배지
export function TabIconBadge({
  icon,
  children,
  count,
  ..._props
}: IconBadgeProps & { count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0">{icon}</span>
      <span>{children}</span>
      {count !== undefined && count > 0 && (
        <Badge variant="destructive" className="ml-1 text-xs">
          {count}
        </Badge>
      )}
    </div>
  );
}
