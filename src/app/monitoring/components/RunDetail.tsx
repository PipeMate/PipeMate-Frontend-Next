import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { getStatusIcon, getStatusBadge } from './Status';
import RunOverviewChips from './RunOverviewChips';
import JobsList from './JobsList';
import LogViewer from './LogViewer';
import { calculateRunStatistics, calculateSuccessRate, isMobile } from '../utils';
import type { WorkflowRun, ActiveTab } from '../types';

interface RunDetailProps {
  selectedRun: WorkflowRun | null;
  activeTab: ActiveTab;
  compact?: boolean;

  // 데이터
  runJobsData: unknown;
  runLogsData: unknown;

  // 상태
  jobsLoading: boolean;
  logsLoading: boolean;

  // 핸들러
  onActiveTabChange: (tab: ActiveTab) => void;
  onClose: () => void;
}

// 워크플로우 이름을 표시용으로 포맷팅
const formatWorkflowName = (name: string, path: string) => {
  // name이 ".github/workflows/xxx.yml" 형태인 경우 파일명만 추출
  if (name.startsWith('.github/workflows/')) {
    return name.split('/').pop()?.replace('.yml', '') || name;
  }
  // name이 "Deploy Monitor" 같은 형태인 경우 그대로 사용
  return name;
};

// 브랜치명 안전하게 가져오기
const getBranchName = (run: WorkflowRun) => {
  return run.head_branch || 'N/A';
};

export default function RunDetail({
  selectedRun,
  activeTab,
  compact = false,
  runJobsData,
  runLogsData,
  jobsLoading,
  logsLoading,
  onActiveTabChange,
  onClose,
}: RunDetailProps) {
  if (!selectedRun) return null;

  const jobs = Array.isArray(runJobsData) ? runJobsData : [];
  const statistics = calculateRunStatistics(jobs);
  const successRate = calculateSuccessRate(statistics);
  const workflowName = formatWorkflowName(selectedRun.name, selectedRun.path);
  const branchName = getBranchName(selectedRun);

  return (
    <Card className="h-full flex flex-col border shadow-sm overflow-hidden">
      {!compact && (
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground">실행 상세</div>
              <CardTitle className="text-lg mt-1 flex items-center gap-2">
                {getStatusIcon(selectedRun.status, selectedRun.conclusion)}
                <span className="truncate">
                  {workflowName}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    #{selectedRun.id}
                  </span>
                </span>
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-xs bg-muted px-2 py-1 rounded mr-2">
                  {branchName}
                </span>
                {selectedRun.path}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isMobile() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
        {/* 개요 요약 */}
        {jobs.length > 0 && !compact && (
          <div className="p-4 border-b flex-shrink-0">
            <RunOverviewChips
              statistics={statistics}
              statusBadge={getStatusBadge(selectedRun.status, selectedRun.conclusion)}
              successRate={successRate}
            />
          </div>
        )}

        {/* 탭 컨텐츠 */}
        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={(value) => onActiveTabChange(value as ActiveTab)}
          className="flex-1 flex flex-col w-full min-h-0 overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 flex-shrink-0 mx-4 mt-4">
            <TabsTrigger value="execution">실행</TabsTrigger>
            <TabsTrigger value="details">상세</TabsTrigger>
          </TabsList>

          <TabsContent
            value="execution"
            className="flex-1 flex flex-col min-h-0 mt-4 px-4 pb-4 overflow-hidden"
          >
            {jobsLoading ? (
              <div className="text-center py-6 text-muted-foreground flex-shrink-0">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Job 정보를 불러오는 중...
              </div>
            ) : (
              <div className="flex-1 overflow-auto min-h-0">
                <JobsList jobs={jobs} isLoading={jobsLoading} />
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="details"
            className="flex-1 flex flex-col min-h-0 mt-4 px-4 pb-4 overflow-hidden"
          >
            {logsLoading ? (
              <div className="text-center py-6 text-muted-foreground flex-shrink-0">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                로그를 불러오는 중...
              </div>
            ) : (
              <div className="flex-1 overflow-auto min-h-0">
                <LogViewer
                  raw={String(runLogsData || '')}
                  filename={`workflow-run-${selectedRun.id}-logs.txt`}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
