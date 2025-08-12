"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useLayout } from "./LayoutContext";
import React from "react";

export default function Header() {
  const { headerRight, headerExtra } = useLayout();

  return (
    <header className="sticky top-0 left-0 right-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between bg-white">
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
