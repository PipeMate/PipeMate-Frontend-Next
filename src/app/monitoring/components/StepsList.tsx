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
      return <SkipForward className="w-4 h-4 text-muted-foreground" />;
    case 'action_required':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
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
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm">실행된 단계가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1">
      {steps.map((step, index) => (
        <div
          key={`${step.name}-${index}`}
          className="flex items-center py-2 hover:bg-muted/50 transition-colors duration-150 rounded-md px-2"
        >
          {/* Step 번호 */}
          <div className="w-6 h-6 flex items-center justify-center text-xs font-medium text-muted-foreground mr-3 flex-shrink-0">
            {index + 1}
          </div>

          {/* 상태 아이콘 */}
          <div className="mr-3 flex-shrink-0">
            {getStepIcon(step.status, step.conclusion)}
          </div>

          {/* Step 내용 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground text-sm truncate">
              {step.name}
            </div>

            {/* 시간 정보 (compact 모드가 아닐 때만 표시) */}
            {!compact && step.startedAt && (
              <div className="text-xs text-muted-foreground mt-1">
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
