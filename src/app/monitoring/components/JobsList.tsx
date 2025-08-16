'use client';

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  SkipForward,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { JobDetail } from '../types';
import { formatDuration } from '../utils';
import StepsList from './StepsList';

// * Job 상태별 아이콘 반환
function getJobIcon(status?: string, conclusion?: string) {
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

// * JobsList 컴포넌트 Props 타입
interface JobsListProps {
  // * Job 목록
  jobs: JobDetail[];
  // * 로딩 상태
  isLoading?: boolean;
}

// * Job 목록 컴포넌트
export default function JobsList({ jobs, isLoading = false }: JobsListProps) {
  const [expandedJobs, setExpandedJobs] = React.useState<Set<number>>(new Set());

  // * jobs가 변경될 때 첫 번째 Job을 자동으로 펼치기
  React.useEffect(() => {
    if (jobs.length > 0 && jobs[0].steps && jobs[0].steps.length > 0) {
      setExpandedJobs(new Set([jobs[0].id]));
    }
  }, [jobs]);

  // * Job 토글 함수
  const toggleJob = (jobId: number) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  // * 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300 animate-pulse" />
        <p className="text-sm">Job 정보를 불러오는 중...</p>
      </div>
    );
  }

  // * Job이 없는 경우
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">실행된 Job이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const isExpanded = expandedJobs.has(job.id);
        const hasSteps = job.steps && job.steps.length > 0;

        return (
          <div
            key={job.id}
            className="border border-gray-200 rounded-lg bg-white shadow-sm"
          >
            {/* Job 헤더 */}
            <div
              className={`flex items-center p-3 transition-colors duration-150 ${
                hasSteps ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
              }`}
              onClick={() => hasSteps && toggleJob(job.id)}
            >
              {/* 펼치기/접기 아이콘 */}
              {hasSteps && (
                <div className="mr-2 text-gray-400 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              )}

              {/* 상태 아이콘 */}
              <div className="mr-2 flex-shrink-0">
                {getJobIcon(job.status, job.conclusion)}
              </div>

              {/* Job 내용 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {job.name}
                </div>
                {job.startedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(job.startedAt).toLocaleTimeString()}
                    {job.completedAt && (
                      <>
                        {' - '}
                        {new Date(job.completedAt).toLocaleTimeString()}
                        {' ('}
                        {formatDuration(job.startedAt, job.completedAt)}
                        {')'}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Steps 개수 */}
              {hasSteps && (
                <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {job.steps!.length} steps
                </div>
              )}
            </div>

            {/* Steps 내용 */}
            {isExpanded && hasSteps && (
              <div className="border-t border-gray-100 bg-gray-50">
                <StepsList steps={job.steps!} compact />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
