'use client';

import { WorkflowStatusBadge, JobStatusBadge } from '@/components/ui';
import { CheckCircle, XCircle, Clock, AlertTriangle, SkipForward } from 'lucide-react';

// * 워크플로우 상태 아이콘 반환
export const getStatusIcon = (status: string, conclusion?: string) => {
  const finalStatus = conclusion || status;

  switch (finalStatus) {
    case 'success':
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'failure':
    case 'cancelled':
    case 'timed_out':
      return <XCircle className="w-5 h-5 text-red-600" />;
    case 'in_progress':
    case 'queued':
    case 'requested':
    case 'waiting':
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    case 'skipped':
      return <SkipForward className="w-5 h-5 text-gray-600" />;
    case 'action_required':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    default:
      return <Clock className="w-5 h-5 text-gray-600" />;
  }
};

// * 워크플로우 상태 배지 반환
export const getStatusBadge = (status: string, conclusion?: string) => {
  return <WorkflowStatusBadge status={conclusion || status} />;
};

// * 스텝 상태 배지 반환
export const getStepBadge = (status?: string, conclusion?: string) => {
  return <JobStatusBadge status={conclusion || status || 'unknown'} size="sm" />;
};

// * 스텝 톤 반환
export const getStepTone = (status?: string, conclusion?: string) => {
  const finalStatus = conclusion || status;

  switch (finalStatus) {
    case 'success':
    case 'completed':
      return 'text-green-600';
    case 'failure':
    case 'cancelled':
    case 'timed_out':
      return 'text-red-600';
    case 'in_progress':
    case 'queued':
    case 'requested':
    case 'waiting':
      return 'text-blue-600';
    case 'skipped':
      return 'text-gray-600';
    case 'action_required':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

// * 워크플로우 상태 배지 컴포넌트 (새로운 방식)
export const WorkflowStatus = ({
  status,
  conclusion,
}: {
  status: string;
  conclusion?: string;
}) => {
  return <WorkflowStatusBadge status={conclusion || status} />;
};

// * Job 상태 배지 컴포넌트 (새로운 방식)
export const JobStatus = ({
  status,
  conclusion,
}: {
  status?: string;
  conclusion?: string;
}) => {
  return <JobStatusBadge status={conclusion || status || 'unknown'} size="sm" />;
};

// * 스텝 상태 배지 컴포넌트 (새로운 방식)
export const StepStatus = ({
  status,
  conclusion,
}: {
  status?: string;
  conclusion?: string;
}) => {
  return <JobStatusBadge status={conclusion || status || 'unknown'} size="sm" />;
};
