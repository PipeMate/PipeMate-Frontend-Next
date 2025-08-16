'use client';

import { ComponentProps, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ROUTES, BRAND } from '@/config';
import { cn } from '@/lib/utils';
import { useLayout } from './LayoutContext';
import { GithubSettingsDialog } from '@/components/features/GithubSettingsDialog';
import { useRepository } from '@/contexts/RepositoryContext';
import { getCookie } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';
import { Github, GitBranch, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

// * 설정 상태 컴포넌트
function SettingsStatus() {
  const { owner, repo, isConfigured } = useRepository();
  const [hasToken, setHasToken] = useState(false);

  // 토큰 상태를 실시간으로 감지하는 함수
  const checkTokenStatus = () => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  };

  // 초기 로드 시 토큰 상태 확인
  useEffect(() => {
    checkTokenStatus();
  }, []);

  // 커스텀 이벤트 리스너로 토큰 상태 변경 감지
  useEffect(() => {
    const handleTokenChange = () => {
      checkTokenStatus();
    };

    // 토큰 변경 이벤트 리스너 등록
    window.addEventListener('token-changed', handleTokenChange);

    // 페이지 포커스 시 토큰 상태 재확인
    const handleFocus = () => {
      checkTokenStatus();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('token-changed', handleTokenChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleOpenGitHub = () => {
    if (owner && repo) {
      window.open(`https://github.com/${owner}/${repo}`, '_blank');
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50/50">
      <div className="p-4 space-y-3">
        <div className="text-sm font-medium text-gray-700">설정 상태</div>

        {/* 토큰 상태 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">GitHub 토큰</span>
          </div>
          {hasToken ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
        </div>

        {/* 레포지토리 상태 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">레포지토리</span>
          </div>
          {isConfigured ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
        </div>

        {/* 레포지토리 정보 표시 */}
        {isConfigured && owner && repo && (
          <div className="bg-white px-3 pt-1 pb-2 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={14} className="text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                현재 레포지토리
              </span>
              <button
                onClick={handleOpenGitHub}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="GitHub에서 보기"
              >
                <ExternalLink size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {owner} / {repo}
                </div>
              </div>
            </div>
          </div>
        )}

        <GithubSettingsDialog onTokenChange={checkTokenStatus} />
      </div>
    </div>
  );
}

// * 사이드바 헤더 컴포넌트
function SidebarHeaderContent() {
  return (
    <SidebarHeader className="border-b border-gray-200 h-16 px-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <BRAND.logo.icon className={cn('w-6 h-6', BRAND.logo.color)} />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-lg text-gray-900 truncate">{BRAND.name}</h1>
          <p className="text-xs text-gray-500 truncate">{BRAND.description}</p>
        </div>
      </div>
    </SidebarHeader>
  );
}

// * 메뉴 컴포넌트
function MenuSection() {
  const router = useRouter();
  const pathname = usePathname();

  const handleRouteClick = (url: string) => {
    router.push(url);
  };

  return (
    <div className="flex-1 py-4">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {Object.values(ROUTES).map((route, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton
                  onClick={() => handleRouteClick(route.url)}
                  className={cn(
                    'mx-2 rounded-lg transition-all duration-200',
                    pathname === route.url
                      ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <route.icon className="w-5 h-5" />
                  {route.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}

// * 사이드바 컴포넌트
export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { sidebarExtra } = useLayout();

  return (
    <Sidebar {...props}>
      <SidebarHeaderContent />
      <SidebarContent className="flex flex-col flex-1 min-h-0">
        {/* 메뉴 섹션 */}
        <MenuSection />

        {/* sidebarExtra slot */}
        {sidebarExtra && (
          <div className="flex-1 min-h-0 overflow-auto">{sidebarExtra}</div>
        )}
      </SidebarContent>

      {/* 설정 상태 */}
      <SettingsStatus />
      <SidebarRail />
    </Sidebar>
  );
}
