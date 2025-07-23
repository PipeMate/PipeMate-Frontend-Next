"use client";

import React, { createContext, useContext, useState } from "react";

interface LayoutContextType {
  headerRight: React.ReactNode;
  headerExtra: React.ReactNode;
  sidebarExtra: React.ReactNode;
  setHeaderRight: (node: React.ReactNode) => void;
  setHeaderExtra: (node: React.ReactNode) => void;
  setSidebarExtra: (node: React.ReactNode) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  headerRight: null,
  headerExtra: null,
  sidebarExtra: null,
  setHeaderRight: () => {},
  setHeaderExtra: () => {},
  setSidebarExtra: () => {},
});

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [headerRight, setHeaderRight] = useState<React.ReactNode>(null);
  const [headerExtra, setHeaderExtra] = useState<React.ReactNode>(null);
  const [sidebarExtra, setSidebarExtra] = useState<React.ReactNode>(null);

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
};

export const useLayout = () => useContext(LayoutContext);
