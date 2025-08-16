// * Providers 모듈 타입 정의

import { ReactNode } from 'react';

// * Provider Props 타입
export interface ProviderProps {
  children: ReactNode;
}

// * Query Client 설정 타입
export interface QueryClientConfig {
  staleTime: number;
  gcTime: number;
  retry: number;
  refetchOnWindowFocus: boolean;
}

export interface MutationConfig {
  retry: number;
}

export interface QueryClientOptions {
  queries: QueryClientConfig;
  mutations: MutationConfig;
}

// * Toast 설정 타입
export interface ToastConfig {
  position:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
  autoClose: number | false;
  hideProgressBar: boolean;
  newestOnTop: boolean;
  closeOnClick: boolean;
  rtl: boolean;
  pauseOnFocusLoss: boolean;
  draggable: boolean;
  pauseOnHover: boolean;
  theme: 'light' | 'dark' | 'colored';
  closeButton: boolean;
  limit: number;
}

// * React Query Devtools 설정 타입
export interface DevtoolsConfig {
  initialIsOpen: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  buttonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
