import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  Activity,
  Loader2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import WorkflowRunCard from './WorkflowRunCard';
import type { WorkflowRun } from '../types';

interface WorkflowRunsListProps {
  // 데이터
  workflowRuns: WorkflowRun[];
  runningWorkflows: WorkflowRun[];
  completedWorkflows: WorkflowRun[];
  displayedCompletedRuns: WorkflowRun[];

  // 상태
  runsLoading: boolean;
  runsError: unknown;
  isManualRefreshing: boolean;
  selectedRunId: number | null;

  // 페이지네이션
  currentPage: number;
  totalPages: number;

  // 핸들러
  onSelectRun: (run: WorkflowRun) => void;
  onManualRefresh: () => void;
  onPageChange: (page: number) => void;
}

export default function WorkflowRunsList({
  workflowRuns,
  runningWorkflows,
  completedWorkflows,
  displayedCompletedRuns,
  runsLoading,
  runsError,
  isManualRefreshing,
  selectedRunId,
  currentPage,
  totalPages,
  onSelectRun,
  onManualRefresh,
  onPageChange,
}: WorkflowRunsListProps) {
  return (
    <div className="space-y-6 relative">
      {/* 새로고침 중 오버레이 */}
      {isManualRefreshing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">워크플로우 실행</h2>
        <span className="text-sm text-gray-500">{workflowRuns.length}개 실행</span>
      </div>

      {runsLoading && !isManualRefreshing ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>워크플로우 실행을 불러오는 중...</p>
        </div>
      ) : runsError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">데이터를 불러올 수 없습니다</p>
              <p className="text-sm mb-4">
                워크플로우 실행 목록을 가져오는 중 오류가 발생했습니다.
              </p>
              <Button
                variant="outline"
                onClick={onManualRefresh}
                disabled={isManualRefreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isManualRefreshing ? 'animate-spin' : ''}`}
                />
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : workflowRuns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">실행된 워크플로우가 없습니다</p>
              <p className="text-sm">
                GitHub Actions에서 워크플로우를 실행하면 여기에 표시됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 현재 실행 중인 워크플로우 */}
          {runningWorkflows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                현재 실행 중 ({runningWorkflows.length}개)
              </h3>
              <div className="space-y-3">
                {runningWorkflows.map((run) => (
                  <WorkflowRunCard
                    key={run.id}
                    run={run}
                    isRunning={true}
                    isSelected={selectedRunId === run.id}
                    onSelect={onSelectRun}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 완료된 워크플로우 */}
          {completedWorkflows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-gray-500" />
                완료된 실행 ({completedWorkflows.length}개)
              </h3>
              <div className="space-y-3">
                {displayedCompletedRuns.map((run) => (
                  <WorkflowRunCard
                    key={run.id}
                    run={run}
                    isSelected={selectedRunId === run.id}
                    onSelect={onSelectRun}
                  />
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    이전
                  </Button>
                  <span className="text-sm text-gray-500">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
