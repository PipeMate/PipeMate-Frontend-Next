'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, SkipForward, AlertTriangle } from 'lucide-react';
import type { JobStep } from '../types';
import { formatDuration } from '../utils';

// * Step 상태별 아이콘 반환
function getStepIcon(status?: string, conclusion?: string) {
  const finalStatus = conclusion || status;

  switch (finalStatus) {
    case 'success':
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'failure':
    case 'cancelled':
    case 'timed_out':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'in_progress':
    case 'queued':
    case 'requested':
    case 'waiting':
      return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
    case 'skipped':
      return <SkipForward className="w-4 h-4 text-gray-500" />;
    case 'action_required':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

// * Step 컴포넌트 Props 타입
interface StepsListProps {
  // * Step 목록
  steps: JobStep[];
  // * 컴팩트 모드 (시간 정보 숨김)
  compact?: boolean;
}

// * Step 목록 컴포넌트
export default function StepsList({ steps, compact = false }: StepsListProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">실행된 단계가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-1">
      {steps.map((step, index) => (
        <div
          key={`${step.name}-${index}`}
          className="flex items-center py-3 hover:bg-gray-50 transition-colors duration-150 rounded-md"
        >
          {/* Step 번호 */}
          <div className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-500 mr-3">
            {index + 1}
          </div>

          {/* 상태 아이콘 */}
          <div className="mr-3">{getStepIcon(step.status, step.conclusion)}</div>

          {/* Step 내용 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{step.name}</div>

            {/* 시간 정보 (compact 모드가 아닐 때만 표시) */}
            {!compact && step.startedAt && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(step.startedAt).toLocaleTimeString()}
                {step.completedAt && (
                  <>
                    {' - '}
                    {new Date(step.completedAt).toLocaleTimeString()}
                    {' ('}
                    {formatDuration(step.startedAt, step.completedAt)}
                    {')'}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
