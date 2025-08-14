'use client';

import React from 'react';
import { CheckCircle, XCircle, MinusCircle, Activity, Clock } from 'lucide-react';
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
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Jobs 개수 */}
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{totalJobs}</span>
            <span className="text-sm text-gray-600">jobs</span>
          </div>

          {/* Steps 개수 */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{totalSteps}</span>
            <span className="text-sm text-gray-600">steps</span>
          </div>

          {/* 성공 Steps */}
          {successSteps > 0 && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{successSteps}</span>
              <span className="text-sm text-gray-600">success</span>
            </div>
          )}

          {/* 실패 Steps */}
          {failedSteps > 0 && (
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">{failedSteps}</span>
              <span className="text-sm text-gray-600">failed</span>
            </div>
          )}

          {/* 스킵 Steps */}
          {skippedSteps > 0 && (
            <div className="flex items-center space-x-2">
              <MinusCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{skippedSteps}</span>
              <span className="text-sm text-gray-600">skipped</span>
            </div>
          )}

          {/* 성공률 (있는 경우만 표시) */}
          {successRate !== undefined && totalSteps > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
              <span className="text-sm font-medium text-gray-900">{successRate}%</span>
              <span className="text-sm text-gray-600">success rate</span>
            </div>
          )}
        </div>

        {/* 상태 배지 */}
        <div className="flex items-center">{statusBadge}</div>
      </div>
    </div>
  );
}
