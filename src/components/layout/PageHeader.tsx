'use client';

import React from 'react';
import { useRepository } from '@/contexts/RepositoryContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, GitBranch, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn('border-b border-gray-200 bg-white px-6 py-4', className)}>
      {/* * 브레드크럼 네비게이션 */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <div className="flex items-center space-x-1">
                {crumb.icon && <crumb.icon className="h-4 w-4" />}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-gray-700 hover:underline transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </div>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* * 메인 헤더 영역 - 가로 배치로 변경 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* * 레포지토리 정보와 페이지 제목을 가로로 배치 */}
          <div className="flex items-center space-x-4 mb-2">
            {/* * 레포지토리 정보 (설정된 경우) */}
            {isConfigured && owner && repo && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md border">
                <Github className="h-4 w-4" />
                <span className="font-medium">{owner}</span>
                <ChevronRight className="h-3 w-3" />
                <GitBranch className="h-4 w-4" />
                <span className="font-medium">{repo}</span>
              </div>
            )}

            {/* * 페이지 제목 */}
            <h1 className="text-xl font-semibold text-gray-900 truncate">{title}</h1>

            {/* * 뱃지들 */}
            {badges.length > 0 && (
              <div className="flex items-center space-x-2">
                {badges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant={badge.variant || 'secondary'}
                    className={cn(
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

          {/* * 페이지 설명 */}
          {description && <p className="text-sm text-gray-600">{description}</p>}

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
