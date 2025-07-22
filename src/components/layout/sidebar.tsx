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
      <SidebarRail />
    </Sidebar>
  );
}
