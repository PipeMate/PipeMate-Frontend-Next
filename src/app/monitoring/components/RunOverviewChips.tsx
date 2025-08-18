'use client';

import React from 'react';
import { Activity, CheckCircle, Clock, MinusCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RunStatistics } from '../types';

// * RunOverviewChips 컴포넌트 Props 타입
interface RunOverviewChipsProps {
  // * 실행 통계
  statistics: RunStatistics;
  // * 상태 배지
  statusBadge: React.ReactNode;
  // * 성공률 (0-100)
  successRate?: number;
}

// * 실행 개요 칩 컴포넌트
export default function RunOverviewChips({
  statistics,
  statusBadge,
  successRate,
}: RunOverviewChipsProps) {
  const { totalJobs, totalSteps, successSteps, failedSteps, skippedSteps } = statistics;

  return (
    <div className="bg-muted/30 rounded-lg border flex justify-center p-3">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-4">
          {/* Jobs 개수 */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{totalJobs}</span>
            <span className="text-xs text-muted-foreground">jobs</span>
          </div>

          {/* Steps 개수 */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{totalSteps}</span>
            <span className="text-xs text-muted-foreground">steps</span>
          </div>

          {/* 성공 Steps */}
          {successSteps > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{successSteps}</span>
              <span className="text-xs text-muted-foreground">success</span>
            </div>
          )}

          {/* 실패 Steps */}
          {failedSteps > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">{failedSteps}</span>
              <span className="text-xs text-muted-foreground">failed</span>
            </div>
          )}

          {/* 스킵 Steps */}
          {skippedSteps > 0 && (
            <div className="flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {skippedSteps}
              </span>
              <span className="text-xs text-muted-foreground">skipped</span>
            </div>
          )}

          {/* 성공률 (있는 경우만 표시) */}
          {successRate !== undefined && totalSteps > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
              <span className="text-sm font-medium text-foreground">{successRate}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 태블릿/모바일 레이아웃 */}
      <div className="md:hidden space-y-2">
        {/* 첫 번째 행: 주요 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Jobs 개수 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{totalJobs}</span>
              <span className="text-xs text-muted-foreground">jobs</span>
            </div>

            {/* Steps 개수 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{totalSteps}</span>
              <span className="text-xs text-muted-foreground">steps</span>
            </div>

            {/* 성공률 */}
            {successRate !== undefined && totalSteps > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
                <span className="text-xs font-medium text-foreground">
                  {successRate}%
                </span>
              </div>
            )}
          </div>

          {/* 상태 배지 */}
          <div className="flex items-center flex-shrink-0">{statusBadge}</div>
        </div>

        {/* 두 번째 행: 상세 통계 */}
        <div className="flex flex-wrap gap-2">
          {/* 성공 Steps */}
          {successSteps > 0 && (
            <div className="flex-shrink-0">
              <Badge
                variant="outline"
                className="text-xs h-6 px-2 border-green-200 text-green-700 bg-green-50 whitespace-nowrap"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {successSteps} success
              </Badge>
            </div>
          )}

          {/* 실패 Steps */}
          {failedSteps > 0 && (
            <div className="flex-shrink-0">
              <Badge
                variant="outline"
                className="text-xs h-6 px-2 border-red-200 text-red-700 bg-red-50 whitespace-nowrap"
              >
                <XCircle className="w-3 h-3 mr-1" />
                {failedSteps} failed
              </Badge>
            </div>
          )}

          {/* 스킵 Steps */}
          {skippedSteps > 0 && (
            <div className="flex-shrink-0">
              <Badge
                variant="outline"
                className="text-xs h-6 px-2 border-gray-200 text-gray-700 bg-gray-50 whitespace-nowrap"
              >
                <MinusCircle className="w-3 h-3 mr-1" />
                {skippedSteps} skipped
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
