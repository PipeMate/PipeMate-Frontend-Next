// * Components 모듈 공통 타입 정의

import { ReactNode } from 'react';

// * 기본 컴포넌트 Props 타입
export interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
}

// * 버튼 관련 타입
export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// * 카드 관련 타입
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// * 다이얼로그 관련 타입
export interface DialogProps extends BaseComponentProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
}

// * 사이드바 관련 타입
export interface SidebarProps extends BaseComponentProps {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'drawer';
  collapsible?: 'offcanvas' | 'icon';
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// * 레이아웃 관련 타입
export interface LayoutProps extends BaseComponentProps {
  sidebarExtra?: ReactNode;
}

// * GitHub 관련 타입
export interface GitHubTokenInfo {
  token: string;
  isValid: boolean;
  scopes?: string[];
}

export interface RepositoryInfo {
  owner: string;
  repo: string;
  isConfigured: boolean;
}

// * 워크플로우 관련 타입
export interface WorkflowInfo {
  id: string;
  name: string;
  path: string;
  state:
    | 'active'
    | 'deleted'
    | 'disabled_fork'
    | 'disabled_inactivity'
    | 'disabled_manually';
  created_at: string;
  updated_at: string;
}

export interface WorkflowRunInfo {
  id: number;
  name: string;
  status:
    | 'completed'
    | 'action_required'
    | 'cancelled'
    | 'failure'
    | 'neutral'
    | 'skipped'
    | 'stale'
    | 'success'
    | 'timed_out'
    | 'in_progress'
    | 'queued'
    | 'requested'
    | 'waiting';
  conclusion: string | null;
  created_at: string;
  updated_at: string;
}

// * 로그 관련 타입
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

// * 프리셋 관련 타입
export interface PresetInfo {
  id: string;
  name: string;
  description?: string;
  type: 'block' | 'pipeline';
  data: any;
}

// * 서버 상태 관련 타입
export interface ServerStatus {
  isOnline: boolean;
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

// * YAML 관련 타입
export interface YamlViewerProps extends BaseComponentProps {
  content: string;
  language?: 'yaml' | 'yml';
  readOnly?: boolean;
  showLineNumbers?: boolean;
  theme?: 'light' | 'dark';
}

// * 에러 관련 타입
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  retry?: () => void;
}

// * 로딩 상태 타입
export interface LoadingState {
  isLoading: boolean;
  error?: ErrorInfo;
  retry?: () => void;
}
