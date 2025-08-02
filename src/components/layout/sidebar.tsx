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
import { Github, GitBranch, CheckCircle, XCircle } from "lucide-react";

// * 설정 상태 컴포넌트
function SettingsStatus() {
  const { owner, repo, isConfigured } = useRepository();
  const [hasToken, setHasToken] = React.useState(false);

  React.useEffect(() => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  }, []);

  return (
    <div className="p-3 border-t border-border space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">설정 상태</h3>

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
      </div>

      <GithubTokenDialog />
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

// * 사이드바 컴포넌트 (반응형)
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarExtra } = useLayout();

  const handleRouteClick = (url: string) => {
    router.push(url);
  };

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
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
                  {/* <SidebarMenuBadge>{route.state}</SidebarMenuBadge> */}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* sidebarExtra slot */}
        {sidebarExtra && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              overflow: "auto",
              marginTop: 16,
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
