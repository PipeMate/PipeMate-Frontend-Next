'use client';

import React from 'react';
import { useRepository } from '@/contexts/RepositoryContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, GitBranch, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/appConstants';

// * 페이지 헤더 props 인터페이스
interface PageHeaderProps {
  // * 페이지 정보
  title: string;
  description?: string;

  // * 브레드크럼 정보
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;

  // * 추가 요소들
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    color?: string;
  }>;

  // * 액션 버튼들
  actions?: React.ReactNode;

  // * 추가 정보
  extra?: React.ReactNode;

  // * 스타일링
  className?: string;
}

// * GitHub 스타일 페이지 헤더 컴포넌트
export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  badges = [],
  actions,
  extra,
  className,
}: PageHeaderProps) {
  const { owner, repo, isConfigured } = useRepository();
  const pathname = usePathname();

  // * 현재 페이지에 해당하는 아이콘 찾기
  const currentRoute = Object.values(ROUTES).find((route) => route.url === pathname);
  const pageIcon = currentRoute?.icon;

  return (
    <div className={cn('', className)}>
      {/* * 메인 헤더 영역 - 컴팩트한 레이아웃 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* * 페이지 제목과 레포 정보를 한 줄에 배치 */}
          <div className="flex items-center space-x-3">
            {/* * 페이지 제목과 아이콘 */}
            <div className="flex items-center space-x-2">
              {pageIcon &&
                React.createElement(pageIcon, { className: 'h-4 w-4 text-gray-600' })}
              <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
            </div>

            {/* * 레포지토리 정보 (설정된 경우) - 작은 크기로 */}
            {isConfigured && owner && repo && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 px-2 py-1 rounded border">
                <Github className="h-3 w-3" />
                <span className="font-medium">{owner}</span>
                <ChevronRight className="h-2 w-2" />
                <GitBranch className="h-3 w-3" />
                <span className="font-medium">{repo}</span>
              </div>
            )}

            {/* * 뱃지들 */}
            {badges.length > 0 && (
              <div className="flex items-center space-x-2">
                {badges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant={badge.variant || 'secondary'}
                    className={cn(
                      'text-xs',
                      badge.color &&
                        `bg-${badge.color}-100 text-${badge.color}-800 border-${badge.color}-200`,
                    )}
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* * 페이지 설명 - 작은 크기로 */}
          {description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{description}</p>
          )}

          {/* * 추가 정보 */}
          {extra && <div className="mt-2">{extra}</div>}
        </div>

        {/* * 액션 버튼들 */}
        {actions && (
          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

// * 페이지 헤더 훅 (LayoutContext와 연동)
export function usePageHeader() {
  const { setHeaderExtra, setHeaderRight } = useLayout();

  const setPageHeader = React.useCallback(
    (props: PageHeaderProps) => {
      const headerContent = <PageHeader {...props} />;
      setHeaderExtra(headerContent);
    },
    [setHeaderExtra],
  );

  const setPageActions = React.useCallback(
    (actions: React.ReactNode) => {
      setHeaderRight(actions);
    },
    [setHeaderRight],
  );

  const clearPageHeader = React.useCallback(() => {
    setHeaderExtra(null);
    setHeaderRight(null);
  }, [setHeaderExtra, setHeaderRight]);

  return {
    setPageHeader,
    setPageActions,
    clearPageHeader,
  };
}

// * useLayout import 추가
import { useLayout } from './LayoutContext';
