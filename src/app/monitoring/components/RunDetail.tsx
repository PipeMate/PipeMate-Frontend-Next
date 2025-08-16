import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
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

// 실행 번호 안전하게 가져오기
const getRunNumber = (run: WorkflowRun) => {
  return (
    run.run_number ||
    (run as { run_number?: number }).run_number ||
    (run as { number?: number }).number ||
    'N/A'
  );
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

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
      {!compact && (
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-500">실행 상세</div>
              <CardTitle className="text-lg mt-1 flex items-center gap-2">
                {getStatusIcon(selectedRun.status, selectedRun.conclusion)}
                <span className="truncate">
                  {selectedRun.name} #{getRunNumber(selectedRun)}
                </span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isMobile() && (
                <Button size="sm" variant="outline" onClick={onClose}>
                  닫기
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="pt-5 flex-1 flex flex-col min-h-0">
        {/* 개요 요약 */}
        {jobs.length > 0 && (
          <div className="mb-4 flex-shrink-0">
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
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="execution">실행</TabsTrigger>
            <TabsTrigger value="details">상세</TabsTrigger>
          </TabsList>

          <TabsContent value="execution" className="flex-1 flex flex-col min-h-0 mt-4">
            {jobsLoading ? (
              <div className="text-center py-6 text-gray-500 flex-shrink-0">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Job 정보를 불러오는 중...
              </div>
            ) : (
              <div className="flex-1 overflow-auto min-h-0">
                <JobsList jobs={jobs} isLoading={jobsLoading} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="flex-1 flex flex-col min-h-0 mt-4">
            {logsLoading ? (
              <div className="text-center py-6 text-gray-500 flex-shrink-0">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                로그를 불러오는 중...
              </div>
            ) : (
              <div className="flex-1 min-h-0">
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
