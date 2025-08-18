'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  headerRight: ReactNode | null;
  headerExtra: ReactNode | null;
  sidebarExtra: ReactNode | null;
  setHeaderRight: (extra: ReactNode | null) => void;
  setHeaderExtra: (extra: ReactNode | null) => void;
  setSidebarExtra: (extra: ReactNode | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [headerRight, setHeaderRight] = useState<ReactNode | null>(null);
  const [headerExtra, setHeaderExtra] = useState<ReactNode | null>(null);
  const [sidebarExtra, setSidebarExtra] = useState<ReactNode | null>(null);

  return (
    <LayoutContext.Provider
      value={{
        headerRight,
        headerExtra,
        sidebarExtra,
        setHeaderRight,
        setHeaderExtra,
        setSidebarExtra,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
