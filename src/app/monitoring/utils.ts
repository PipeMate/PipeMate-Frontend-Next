// * 모니터링 페이지 유틸리티 함수
// * - 시간 포맷팅, 통계 계산, 텍스트 처리 등의 유틸리티 함수들을 정의합니다.

import type { JobDetail, RunStatistics } from './types';

// ============================================================================
// * 시간 관련 유틸리티
// ============================================================================

// * 지속 시간 포맷팅 (예: "2m 30s", "45s")
export function formatDuration(start?: string, end?: string): string {
  if (!start) return '';

  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const durationMs = Math.max(0, endTime - startTime);
  const durationSec = Math.floor(durationMs / 1000);

  if (durationSec < 60) return `${durationSec}s`;

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

// * 날짜/시간 포맷팅 (로컬 시간대)
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// * 상대적 시간 포맷팅 (예: "2분 전", "1시간 전")
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDateTime(dateString);
}

// ============================================================================
// * 통계 계산 유틸리티
// ============================================================================

// * Job 목록에서 실행 통계 계산
export function calculateRunStatistics(jobs: JobDetail[]): RunStatistics {
  const totalJobs = jobs.length;
  const allSteps = jobs.flatMap((job) => job.steps || []);
  const totalSteps = allSteps.length;

  const successSteps = allSteps.filter(
    (step) => step.conclusion === 'success' || step.conclusion === 'completed',
  ).length;

  const failedSteps = allSteps.filter(
    (step) =>
      step.conclusion === 'failure' ||
      step.conclusion === 'failed' ||
      step.conclusion === 'cancelled' ||
      step.conclusion === 'timed_out',
  ).length;

  const skippedSteps = allSteps.filter((step) => step.conclusion === 'skipped').length;

  return {
    totalJobs,
    totalSteps,
    successSteps,
    failedSteps,
    skippedSteps,
  };
}

// * 성공률 계산 (0-100)
export function calculateSuccessRate(statistics: RunStatistics): number {
  if (statistics.totalSteps === 0) return 0;
  return Math.round((statistics.successSteps / statistics.totalSteps) * 100);
}

// ============================================================================
// * 텍스트 처리 유틸리티
// ============================================================================

// * 텍스트를 클립보드에 복사
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('클립보드 복사 실패:', error);
    return false;
  }
}

// * 텍스트 파일 다운로드
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// * 키워드 기반 로그 스니펫 추출
export function extractLogSnippet(
  logText: string,
  keyword: string,
  contextLines: number = 40,
): string {
  const lines = logText.split(/\r?\n/);
  const matches: number[] = [];

  // 키워드가 포함된 라인 찾기
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      matches.push(index);
    }
  });

  if (matches.length === 0) return '';

  // 첫 번째 매치 주변 컨텍스트 추출
  const firstMatch = matches[0];
  const start = Math.max(0, firstMatch - contextLines);
  const end = Math.min(lines.length, firstMatch + contextLines);

  return lines.slice(start, end).join('\n');
}

// ============================================================================
// * 반응형 유틸리티
// ============================================================================

// * 디바이스 타입 감지
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// * 모바일 여부 확인
export function isMobile(): boolean {
  return getDeviceType() === 'mobile';
}

// * 태블릿 여부 확인
export function isTablet(): boolean {
  return getDeviceType() === 'tablet';
}

// * 데스크톱 여부 확인
export function isDesktop(): boolean {
  return getDeviceType() === 'desktop';
}
