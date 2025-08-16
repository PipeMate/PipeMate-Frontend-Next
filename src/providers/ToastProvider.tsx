'use client';

// * Toast 알림 Provider
// * - 전역 토스트 알림 설정
// * - 타입 안전성 보장
// * - 일관된 사용자 경험 제공
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { ToastConfig } from './types';

// * Toast 설정 상수
const TOAST_CONFIG: ToastConfig = {
  position: 'top-right',
  autoClose: 2500,
  hideProgressBar: true,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: false,
  draggable: false,
  pauseOnHover: false,
  theme: 'light',
  closeButton: false,
  limit: 3,
} as const;

// * ToastProvider
// * - 전역 토스트 알림 컨테이너
// * - 일관된 토스트 스타일 및 동작 제공
// * - 성능 최적화 적용
export default function ToastProvider() {
  return (
    <ToastContainer
      position={TOAST_CONFIG.position}
      autoClose={TOAST_CONFIG.autoClose}
      hideProgressBar={TOAST_CONFIG.hideProgressBar}
      newestOnTop={TOAST_CONFIG.newestOnTop}
      closeOnClick={TOAST_CONFIG.closeOnClick}
      rtl={TOAST_CONFIG.rtl}
      pauseOnFocusLoss={TOAST_CONFIG.pauseOnFocusLoss}
      draggable={TOAST_CONFIG.draggable}
      pauseOnHover={TOAST_CONFIG.pauseOnHover}
      theme={TOAST_CONFIG.theme}
      closeButton={TOAST_CONFIG.closeButton}
      limit={TOAST_CONFIG.limit}
    />
  );
}
