import { useCallback, useState } from 'react';

export interface RefreshFeedback {
  type: 'success' | 'error' | null;
  message: string;
}

export interface RefreshFeedbackState {
  isManualRefreshing: boolean;
  refreshFeedback: RefreshFeedback;
}

export interface RefreshFeedbackActions {
  setIsManualRefreshing: (refreshing: boolean) => void;
  setRefreshFeedback: (feedback: RefreshFeedback) => void;
  handleManualRefresh: (refetchFn: () => Promise<unknown> | void) => Promise<void>;
}

export function useRefreshFeedback(): RefreshFeedbackState & RefreshFeedbackActions {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<RefreshFeedback>({
    type: null,
    message: '',
  });

  const handleManualRefresh = useCallback(
    async (refetchFn: () => Promise<unknown> | void) => {
      if (isManualRefreshing) return;

      setIsManualRefreshing(true);
      setRefreshFeedback({ type: null, message: '' });

      try {
        await refetchFn();
        setRefreshFeedback({
          type: 'success',
          message: '워크플로우 목록이 성공적으로 새로고침되었습니다.',
        });
      } catch {
        setRefreshFeedback({
          type: 'error',
          message: '새로고침 중 오류가 발생했습니다.',
        });
      } finally {
        setIsManualRefreshing(false);
        // * 3초 후 피드백 메시지 제거
        setTimeout(() => {
          setRefreshFeedback({ type: null, message: '' });
        }, 3000);
      }
    },
    [isManualRefreshing],
  );

  return {
    isManualRefreshing,
    refreshFeedback,
    setIsManualRefreshing,
    setRefreshFeedback,
    handleManualRefresh,
  };
}
