'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { useLayout } from './LayoutContext';
import React from 'react';

export default function Header() {
  const { headerRight, headerExtra } = useLayout();

  return (
    <header className="sticky top-0 left-0 right-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-4 justify-between bg-white">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-3 data-[orientation=vertical]:h-5"
        />
        {/* headerExtra slot (왼쪽: 타이틀/배지) */}
        {headerExtra && <div className="flex items-center gap-2.5">{headerExtra}</div>}
      </div>
      {/* headerRight slot (오른쪽: 기능 버튼) */}
      {headerRight && (
        <div className="ml-auto flex items-center gap-2.5">{headerRight}</div>
      )}
    </header>
  );
}
