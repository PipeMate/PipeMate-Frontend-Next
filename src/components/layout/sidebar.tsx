"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ROUTE_LIST, BRAND } from "@/config";
import { cn } from "@/lib/utils";
import { useLayout } from "./LayoutContext";
import { GithubTokenDialog } from "@/components/features/GithubTokenDialog";
import { useRepository } from "@/contexts/RepositoryContext";
import { getCookie } from "@/lib/cookieUtils";
import { STORAGES } from "@/config/appConstants";
import {
  Github,
  GitBranch,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// * 설정 상태 컴포넌트 (접을 수 있음)
function SettingsStatus() {
  const { owner, repo, isConfigured } = useRepository();
  const [hasToken, setHasToken] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  }, []);

  return (
    <div className="border-t border-border">
      {/* 설정 상태 헤더 (항상 표시) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {hasToken ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
            {isConfigured ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
          </div>
          <span>설정 상태</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>

      {/* 설정 상태 상세 내용 (접힌 상태에서는 숨김) */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
          {/* 토큰 상태 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Github size={14} className="text-gray-500" />
              <span className="text-gray-600">GitHub 토큰</span>
            </div>
            {hasToken ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
          </div>

          {/* 레포지토리 상태 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-gray-500" />
              <span className="text-gray-600">레포지토리</span>
            </div>
            {isConfigured ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
          </div>

          {/* 레포지토리 정보 표시 */}
          {isConfigured && owner && repo && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <div className="font-medium">
                {owner}/{repo}
              </div>
            </div>
          )}

          <GithubTokenDialog />
        </div>
      )}
    </div>
  );
}

// * 사이드바 헤더 컴포넌트
function SidebarHeaderContent() {
  return (
    <SidebarHeader className="border-b border-border h-16 px-2">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <BRAND.logo.icon className={cn("w-5 h-5", BRAND.logo.color)} />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-lg text-gray-900 truncate">
            {BRAND.name}
          </h1>
          <p className="text-xs text-gray-500 truncate">{BRAND.description}</p>
        </div>
      </div>
    </SidebarHeader>
  );
}

// * 메뉴 컴포넌트 (접을 수 있음)
function MenuSection() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleRouteClick = (url: string) => {
    router.push(url);
  };

  return (
    <div className="border-b border-border">
      {/* 메뉴 헤더 (항상 표시) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>메뉴</span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>

      {/* 메뉴 내용 (접힌 상태에서는 숨김) */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {ROUTE_LIST.map((route, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      onClick={() => handleRouteClick(route.url)}
                      className={
                        pathname === route.url
                          ? "bg-blue-100 text-blue-700 font-bold hover:text-blue-700 hover:bg-blue-100"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-50 active:text-blue-700"
                      }
                    >
                      <route.icon />
                      {route.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      )}
    </div>
  );
}

// * 사이드바 컴포넌트 (반응형)
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarExtra } = useLayout();

  return (
    <Sidebar {...props}>
      <SidebarHeaderContent />
      <SidebarContent
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* 메뉴 섹션 */}
        <MenuSection />

        {/* sidebarExtra slot - 접힌 공간을 차지 */}
        {sidebarExtra && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              overflow: "auto",
            }}
          >
            {sidebarExtra}
          </div>
        )}
      </SidebarContent>

      {/* 설정 상태 및 관리 다이얼로그 */}
      <SettingsStatus />
      <SidebarRail />
    </Sidebar>
  );
}
