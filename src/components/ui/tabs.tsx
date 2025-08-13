'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
} | null>(null);

const Tabs = ({ defaultValue, value, onValueChange, className, children }: TabsProps) => {
  const [internalActive, setInternalActive] = React.useState(defaultValue);
  const activeTab = value ?? internalActive;
  const setActiveTab = (next: string) => {
    if (onValueChange) onValueChange(next);
    if (value === undefined) setInternalActive(next);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className, children }: TabsListProps) => {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600',
        className,
      )}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, className, children, onClick }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.activeTab === value;

  const handleClick = () => {
    context?.setActiveTab(value);
    onClick?.();
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900',
        className,
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className, children }: TabsContentProps) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.activeTab === value;

  if (!isActive) return null;

  return <div className={cn('mt-2', className)}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
