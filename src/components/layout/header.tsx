"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { ROUTE_LABELS, ROUTE_LIST, ROUTE_URLS } from "@/config";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 경로에 해당하는 라우트 정보 찾기
  const currentRoute = ROUTE_LIST.find((route) => route.url === pathname);

  // 브레드크럼 아이템 생성
  const generateBreadcrumbItems = () => {
    const items = [];

    // 홈 항목 추가 (ROUTE의 첫 번째 항목 사용)
    items.push({
      label: ROUTE_LABELS[0],
      href: ROUTE_URLS[0],
      isCurrent: pathname === ROUTE_URLS[0],
    });

    // 현재 경로가 홈이 아닌 경우 현재 페이지 추가
    if (pathname !== "/" && currentRoute) {
      items.push({
        label: currentRoute.label,
        href: currentRoute.url,
        isCurrent: true,
      });
    }

    return items;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  const handleBreadcrumbClick = (href: string) => {
    router.push(href);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.isCurrent ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleBreadcrumbClick(item.href);
                    }}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
