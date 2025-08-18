import { useState } from 'react';
import type { ActiveTab, WorkflowRun } from '../types';

export interface MonitoringState {
  selectedRun: WorkflowRun | null;
  selectedRunId: number | null;
  selectedRunSnapshot: WorkflowRun | null;
  activeTab: ActiveTab;
  isDetailOpen: boolean;
  autoRefresh: boolean;
  currentPage: number;
  isInitialMount: boolean;
}

export interface MonitoringActions {
  setSelectedRun: (run: WorkflowRun | null) => void;
  setSelectedRunId: (id: number | null) => void;
  setSelectedRunSnapshot: (run: WorkflowRun | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setIsDetailOpen: (open: boolean) => void;
  setAutoRefresh: (refresh: boolean) => void;
  setCurrentPage: (page: number) => void;
  setIsInitialMount: (mount: boolean) => void;
}

export function useMonitoringState(): MonitoringState & MonitoringActions {
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedRunSnapshot, setSelectedRunSnapshot] = useState<WorkflowRun | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('execution');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialMount, setIsInitialMount] = useState(true);

  return {
    // * State
    selectedRun,
    selectedRunId,
    selectedRunSnapshot,
    activeTab,
    isDetailOpen,
    autoRefresh,
    currentPage,
    isInitialMount,
    // * Actions
    setSelectedRun,
    setSelectedRunId,
    setSelectedRunSnapshot,
    setActiveTab,
    setIsDetailOpen,
    setAutoRefresh,
    setCurrentPage,
    setIsInitialMount,
  };
}
