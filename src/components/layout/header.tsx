"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useLayout } from "./LayoutContext";
import React from "react";

export default function Header() {
  const { headerRight, headerExtra } = useLayout();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        {/* headerExtra slot */}
        {headerExtra && (
          <div className="ml-4 flex flex-col justify-center">{headerExtra}</div>
        )}
      </div>
      {/* headerRight slot */}
      {headerRight && <div className="ml-auto">{headerRight}</div>}
    </header>
  );
}
