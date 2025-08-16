'use client';

// * React 및 UI 컴포넌트 import
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

// * 컨텍스트 및 설정 import
import { useLayout } from '@/components/layout/LayoutContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { Monitor, Clock, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/appConstants';

// * 유틸리티 및 타입 import
import { isMobile, isTablet } from './utils';
import type { WorkflowRun } from './types';

// * 커스텀 훅 및 컴포넌트 import
import { useMonitoringState, useRefreshFeedback, useWorkflowData } from './hooks';
import { RefreshFeedback, WorkflowRunsList, RunDetail } from './components';

// * 모니터링 페이지
export default function MonitoringPage() {
  const { setHeaderExtra, setHeaderRight } = useLayout();
  const { owner, repo, isConfigured } = useRepository();
  const MonitoringIcon = ROUTES.MONITORING.icon;

  // * 상태 관리 커스텀 훅
  const {
    selectedRun,
    selectedRunId,
    selectedRunSnapshot,
    activeTab,
    isDetailOpen,
    autoRefresh,
    currentPage,
    isInitialMount,
    setSelectedRun,
    setSelectedRunId,
    setSelectedRunSnapshot,
    setActiveTab,
    setIsDetailOpen,
    setAutoRefresh,
    setCurrentPage,
    setIsInitialMount,
  } = useMonitoringState();

  // * 새로고침 피드백
  const { isManualRefreshing, refreshFeedback, handleManualRefresh } =
    useRefreshFeedback();

  // * 워크플로우 데이터 (API 호출 및 데이터 처리)
  const {
    workflowRuns,
    runningWorkflows,
    completedWorkflows,
    displayedCompletedRuns,
    totalPages,
    runsLoading,
    runsError,
    jobsLoading,
    logsLoading,
    runJobsData,
    runLogsData,
    refetchRuns,
  } = useWorkflowData({
    owner: owner || '',
    repo: repo || '',
    isConfigured,
    autoRefresh,
    selectedRunId,
    currentPage,
  });

  // ? 조건부 렌더링을 위한 상태 계산
  const isFullLoading = isInitialMount && (runsLoading || !isConfigured);
  const showRepositoryNotConfigured = !isInitialMount && !isConfigured;
  const showWorkflowContent = !isFullLoading && isConfigured;

  // * 초기 마운트 처리 (화면 깜빡임 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [setIsInitialMount]);

  // * 반응형 디바이스에서 상세 패널을 시트로 표시
  useEffect(() => {
    const handleResize = () => {
      if ((isMobile() || isTablet()) && selectedRunId) {
        setIsDetailOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedRunId, setIsDetailOpen]);

  // * 레이아웃 헤더 설정 (타이틀, 버튼 등)
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
          onClick={() => handleManualRefresh(refetchRuns)}
          disabled={isManualRefreshing || runsLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${
              isManualRefreshing || runsLoading ? 'animate-spin' : ''
            }`}
          />
          {isManualRefreshing ? '새로고침 중...' : '새로고침'}
        </Button>
      </div>,
    );

    // ! 컴포넌트 언마운트 시 헤더 정리 필수
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
    runsLoading,
    isManualRefreshing,
    handleManualRefresh,
    refetchRuns,
    setAutoRefresh,
  ]);

  // * 워크플로우 실행 선택 시 상세 보기 핸들러
  const handleShowDetails = (run: WorkflowRun) => {
    setSelectedRun(run);
    setSelectedRunId(run.id);
    setSelectedRunSnapshot(run);
    setActiveTab('execution');
    // ? 모바일/태블릿에서는 시트로 표시
    if (isMobile() || isTablet()) {
      setIsDetailOpen(true);
    }
  };

  // * 데이터 리페치 시 선택된 실행 상태 유지
  useEffect(() => {
    if (!selectedRunId) return;

    const found = workflowRuns.find((r) => r.id === selectedRunId);
    if (found) {
      setSelectedRun(found);
    } else if (!selectedRun && selectedRunSnapshot) {
      setSelectedRun(selectedRunSnapshot);
    }
  }, [workflowRuns, selectedRunId, selectedRun, selectedRunSnapshot, setSelectedRun]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* * 새로고침 성공/실패 토스트 메시지 */}
      <RefreshFeedback feedback={refreshFeedback} />

      {/* ? 초기 로딩 중일 때만 표시되는 통합 로딩 화면 */}
      {isFullLoading && (
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-24 text-gray-500">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium mb-2">
              워크플로우 모니터링을 준비하고 있습니다
            </p>
            <p className="text-sm">잠시만 기다려주세요...</p>
          </div>
        </div>
      )}

      {/* ? 리포지토리가 설정되지 않았을 때 안내 메시지 */}
      {showRepositoryNotConfigured && (
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

      {/* * 메인 워크플로우 모니터링 컨텐츠 */}
      {showWorkflowContent && (
        <div className="container mx-auto px-4 py-6">
          {/* * 데스크톱: 실행 목록(3/5) + 상세 패널(2/5) 레이아웃 */}
          <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
            <div className="lg:col-span-3">
              <WorkflowRunsList
                workflowRuns={workflowRuns}
                runningWorkflows={runningWorkflows}
                completedWorkflows={completedWorkflows}
                displayedCompletedRuns={displayedCompletedRuns}
                runsLoading={runsLoading}
                runsError={runsError}
                isManualRefreshing={isManualRefreshing}
                selectedRunId={selectedRunId}
                currentPage={currentPage}
                totalPages={totalPages}
                onSelectRun={handleShowDetails}
                onManualRefresh={() => handleManualRefresh(refetchRuns)}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* ? 선택된 실행이 있으면 상세 패널, 없으면 안내 메시지 */}
            <div className="lg:col-span-2 h-[calc(100vh-200px)]">
              {selectedRun ? (
                <RunDetail
                  selectedRun={selectedRun}
                  activeTab={activeTab}
                  runJobsData={runJobsData}
                  runLogsData={runLogsData}
                  jobsLoading={jobsLoading}
                  logsLoading={logsLoading}
                  onActiveTabChange={setActiveTab}
                  onClose={() => setSelectedRun(null)}
                />
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

          {/* * 태블릿: 실행 목록(2/3) + 상세 패널(1/3) 레이아웃 */}
          <div className="hidden md:grid lg:hidden md:grid-cols-3 md:gap-4">
            <div className="md:col-span-2">
              <WorkflowRunsList
                workflowRuns={workflowRuns}
                runningWorkflows={runningWorkflows}
                completedWorkflows={completedWorkflows}
                displayedCompletedRuns={displayedCompletedRuns}
                runsLoading={runsLoading}
                runsError={runsError}
                isManualRefreshing={isManualRefreshing}
                selectedRunId={selectedRunId}
                currentPage={currentPage}
                totalPages={totalPages}
                onSelectRun={handleShowDetails}
                onManualRefresh={() => handleManualRefresh(refetchRuns)}
                onPageChange={setCurrentPage}
              />
            </div>

            <div className="md:col-span-1 h-[calc(100vh-200px)]">
              {selectedRun ? (
                <RunDetail
                  selectedRun={selectedRun}
                  activeTab={activeTab}
                  runJobsData={runJobsData}
                  runLogsData={runLogsData}
                  jobsLoading={jobsLoading}
                  logsLoading={logsLoading}
                  onActiveTabChange={setActiveTab}
                  onClose={() => setSelectedRun(null)}
                />
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

          {/* * 모바일: 실행 목록만 표시 (상세는 시트로) */}
          <div className="md:hidden">
            <WorkflowRunsList
              workflowRuns={workflowRuns}
              runningWorkflows={runningWorkflows}
              completedWorkflows={completedWorkflows}
              displayedCompletedRuns={displayedCompletedRuns}
              runsLoading={runsLoading}
              runsError={runsError}
              isManualRefreshing={isManualRefreshing}
              selectedRunId={selectedRunId}
              currentPage={currentPage}
              totalPages={totalPages}
              onSelectRun={handleShowDetails}
              onManualRefresh={() => handleManualRefresh(refetchRuns)}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* * 모바일/태블릿에서 상세 정보를 시트로 표시 */}
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
                <RunDetail
                  selectedRun={selectedRun}
                  activeTab={activeTab}
                  compact={true}
                  runJobsData={runJobsData}
                  runLogsData={runLogsData}
                  jobsLoading={jobsLoading}
                  logsLoading={logsLoading}
                  onActiveTabChange={setActiveTab}
                  onClose={() => setSelectedRun(null)}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
