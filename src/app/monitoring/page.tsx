'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useLayout } from '@/components/layout/LayoutContext';
import { useRepository } from '@/contexts/RepositoryContext';
import {
  useWorkflows,
  useWorkflowRuns,
  useCancelWorkflowRun,
  useWorkflowRunJobs,
  useWorkflowRunLogs,
  useWorkflowRunDetail,
} from '@/api';
import {
  Monitor,
  Play,
  Clock,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertTriangle,
  Info,
  Loader2,
  X,
  GitBranch,
  GitCommit,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getStatusIcon, getStatusBadge } from './components/Status';
import RunOverviewChips from './components/RunOverviewChips';
import JobsList from './components/JobsList';
import LogViewer from './components/LogViewer';
import { ROUTES } from '@/config/appConstants';
import type { WorkflowRun, ActiveTab } from './types';
import {
  formatDuration,
  formatDateTime,
  formatRelativeTime,
  calculateRunStatistics,
  calculateSuccessRate,
  isMobile,
  isTablet,
} from './utils';

// * 페이지네이션 설정
const ITEMS_PER_PAGE = 10;
const INITIAL_ITEMS = 5;

// * 모니터링 페이지 컴포넌트
export default function MonitoringPage() {
  const { setHeaderExtra, setHeaderRight } = useLayout();
  const { owner, repo, isConfigured } = useRepository();
  const MonitoringIcon = ROUTES.MONITORING.icon;

  // * 상태 관리
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedRunSnapshot, setSelectedRunSnapshot] = useState<WorkflowRun | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('execution');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // * 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // * API 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
  } = useWorkflows(owner || '', repo || '');

  const autoRefreshPausedDueToDetails = !!selectedRun && activeTab === 'details';
  const {
    data: workflowRunsData,
    isLoading: runsLoading,
    refetch: refetchRuns,
  } = useWorkflowRuns(owner || '', repo || '', {
    refetchInterval: autoRefresh && !autoRefreshPausedDueToDetails ? 10 * 1000 : false,
    refetchOnWindowFocus: false,
  });

  const cancelWorkflowRun = useCancelWorkflowRun();

  // * 데이터 파싱
  const runsResponse = workflowRunsData as unknown as
    | { workflow_runs?: WorkflowRun[] }
    | undefined;
  const workflowRuns: WorkflowRun[] = Array.isArray(runsResponse?.workflow_runs)
    ? runsResponse!.workflow_runs
    : [];

  // * 페이지네이션된 실행 목록
  const displayedRuns = showAll
    ? workflowRuns.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : workflowRuns.slice(0, INITIAL_ITEMS);

  const totalPages = Math.ceil(workflowRuns.length / ITEMS_PER_PAGE);
  const hasMoreRuns = workflowRuns.length > INITIAL_ITEMS;

  // * 상세 데이터 로드 (선택 시)
  const runId = selectedRun?.id ? String(selectedRun.id) : '';
  const { data: runJobsData, isLoading: jobsLoading } = useWorkflowRunJobs(
    owner || '',
    repo || '',
    runId,
  );
  const { data: runLogsData, isLoading: logsLoading } = useWorkflowRunLogs(
    owner || '',
    repo || '',
    runId,
  );
  const { data: runDetailData } = useWorkflowRunDetail(owner || '', repo || '', runId);

  // * 반응형 처리
  useEffect(() => {
    const handleResize = () => {
      if ((isMobile() || isTablet()) && selectedRunId) {
        setIsDetailOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedRunId]);

  // * 헤더 설정 (전체 레이아웃 헤더에 표시)
  useEffect(() => {
    setHeaderExtra(
      <div className="flex items-center gap-2">
        <MonitoringIcon className="w-5 h-5" />
        <span>워크플로우 모니터링</span>
        {isConfigured && owner && repo && (
          <span className="text-sm text-gray-500 ml-2">
            {owner} / {repo}
          </span>
        )}
      </div>,
    );

    setHeaderRight(
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
          <Clock className="w-4 h-4 mr-1" />
          {autoRefresh ? '자동 새로고침 켜짐' : '자동 새로고침 꺼짐'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            refetchWorkflows();
            refetchRuns();
          }}
          disabled={workflowsLoading || runsLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${
              workflowsLoading || runsLoading ? 'animate-spin' : ''
            }`}
          />
          새로고침
        </Button>
      </div>,
    );

    return () => {
      setHeaderExtra(null);
      setHeaderRight(null);
    };
  }, [
    setHeaderExtra,
    setHeaderRight,
    MonitoringIcon,
    isConfigured,
    owner,
    repo,
    autoRefresh,
    workflowsLoading,
    runsLoading,
    refetchWorkflows,
    refetchRuns,
  ]);

  // * 상세 보기 핸들러
  const handleShowDetails = (run: WorkflowRun) => {
    setSelectedRun(run);
    setSelectedRunId(run.id);
    setSelectedRunSnapshot(run);
    setActiveTab('execution');
    if (isMobile() || isTablet()) {
      setIsDetailOpen(true);
    }
  };

  // * 리페치 시 선택된 실행 유지
  useEffect(() => {
    if (!selectedRunId) return;

    const list: WorkflowRun[] = Array.isArray(runsResponse?.workflow_runs)
      ? runsResponse!.workflow_runs
      : [];

    const found = list.find((r) => r.id === selectedRunId);
    if (found) {
      setSelectedRun(found);
    } else if (!selectedRun && selectedRunSnapshot) {
      setSelectedRun(selectedRunSnapshot);
    }
  }, [workflowRunsData, selectedRunId, selectedRun, selectedRunSnapshot, runsResponse]);

  // * 실행 취소 핸들러
  const handleCancelRun = async (runId: number) => {
    try {
      await cancelWorkflowRun.mutateAsync({
        owner: owner!,
        repo: repo!,
        runId: String(runId),
      });
      refetchRuns();
    } catch (error) {
      console.error('워크플로우 실행 취소 실패:', error);
    }
  };

  // * 실행 번호 안전하게 가져오기
  const getRunNumber = (run: WorkflowRun) => {
    // 백엔드 응답 구조에 따라 다른 필드명 확인
    return run.run_number || (run as any).run_number || (run as any).number || 'N/A';
  };

  // * 실행 목록 컴포넌트
  const WorkflowRunsList = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">워크플로우 실행</h2>
        <span className="text-sm text-gray-500">{workflowRuns.length}개 실행</span>
      </div>

      {runsLoading ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>워크플로우 실행을 불러오는 중...</p>
        </div>
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
          <div className="space-y-3">
            {displayedRuns.map((run) => {
              return (
                <Card
                  key={run.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedRun?.id === run.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleShowDetails(run)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getStatusIcon(run.status, run.conclusion)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {run.name} #{getRunNumber(run)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(run.created_at)}
                            {' • '}
                            {formatDuration(run.created_at, run.updated_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(run.status, run.conclusion)}
                        {run.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRun(run.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                            취소
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 더보기/페이지네이션 */}
          {!showAll && hasMoreRuns && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
                className="w-full"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                더보기 ({workflowRuns.length - INITIAL_ITEMS}개 더)
              </Button>
            </div>
          )}

          {showAll && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {showAll && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAll(false);
                  setCurrentPage(1);
                }}
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                간단히 보기
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // * 실행 상세 컴포넌트
  const RunDetail = ({ compact = false }: { compact?: boolean }) => {
    if (!selectedRun) return null;

    const meta = runDetailData?.data || {};
    const jobs = Array.isArray(runJobsData) ? runJobsData : [];
    const statistics = calculateRunStatistics(jobs);
    const successRate = calculateSuccessRate(statistics);

    const metaRows = [
      { key: 'Run ID', value: selectedRun.id, icon: Activity },
      { key: 'Workflow', value: selectedRun.name, icon: Monitor },
      { key: 'Status', value: selectedRun.status, icon: Info },
      { key: 'Conclusion', value: selectedRun.conclusion || '-', icon: AlertTriangle },
      { key: 'Created', value: formatDateTime(selectedRun.created_at), icon: Calendar },
      { key: 'Updated', value: formatDateTime(selectedRun.updated_at), icon: Clock },
      { key: 'Run #', value: getRunNumber(selectedRun), icon: TrendingUp },
      { key: 'Repo', value: `${owner}/${repo}`, icon: Monitor },
      { key: 'Branch', value: (meta as any)?.head_branch || '-', icon: GitBranch },
      { key: 'Commit', value: (meta as any)?.head_sha || '-', icon: GitCommit },
      { key: 'Event', value: (meta as any)?.event || '-', icon: Play },
    ];

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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRun(null)}
                  >
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
            onValueChange={(value) => setActiveTab(value as ActiveTab)}
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
                    raw={runLogsData || ''}
                    filename={`workflow-run-${selectedRun.id}-logs.txt`}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  // * 메인 컨텐츠
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 설정 확인 */}
      {!isConfigured && (
        <div className="container mx-auto px-4 py-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">리포지토리가 설정되지 않았습니다.</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                워크플로우를 모니터링하려면 먼저 GitHub 리포지토리를 설정해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      {isConfigured && (
        <div className="container mx-auto px-4 py-6">
          {/* 데스크톱: 2열 레이아웃 */}
          <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
            {/* 좌측: 실행 목록 */}
            <div className="lg:col-span-3">
              <WorkflowRunsList />
            </div>

            {/* 우측: 상세 패널 */}
            <div className="lg:col-span-2 h-[calc(100vh-200px)]">
              {selectedRun ? (
                <RunDetail />
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="p-10 text-center text-gray-500 h-full flex items-center justify-center">
                    <div>
                      <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <div className="text-lg font-medium mb-2">실행 상세</div>
                      <div className="text-sm">
                        좌측에서 실행을 선택하면 이 영역에 상세 정보가 표시됩니다.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 태블릿: 2열 레이아웃 (반응형) */}
          <div className="hidden md:grid lg:hidden md:grid-cols-3 md:gap-4">
            {/* 좌측: 실행 목록 */}
            <div className="md:col-span-2">
              <WorkflowRunsList />
            </div>

            {/* 우측: 상세 패널 */}
            <div className="md:col-span-1 h-[calc(100vh-200px)]">
              {selectedRun ? (
                <RunDetail />
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="p-6 text-center text-gray-500 h-full flex items-center justify-center">
                    <div>
                      <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <div className="text-sm font-medium mb-1">실행 상세</div>
                      <div className="text-xs">좌측에서 실행을 선택하세요.</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 모바일: 1열 레이아웃 */}
          <div className="md:hidden">
            <WorkflowRunsList compact />
          </div>
        </div>
      )}

      {/* 모바일/태블릿용 시트 */}
      {(isMobile() || isTablet()) && (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <SheetTitle className="text-lg font-semibold">실행 상세</SheetTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  닫기
                </Button>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <RunDetail compact />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
