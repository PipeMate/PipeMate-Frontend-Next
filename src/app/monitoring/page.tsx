'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLayout } from '@/components/layout/LayoutContext';
import { useRepository } from '@/contexts/RepositoryContext';
import {
  useWorkflows,
  useWorkflowRuns,
  useCancelWorkflowRun,
  useWorkflowRunJobs,
  useWorkflowRunLogs,
  useWorkflowRunDetail,
} from '@/api/hooks';
import {
  Monitor,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  GitBranch,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import { ROUTES } from '@/config/appConstants';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  created_at: string;
  updated_at: string;
  run_number: number;
  workflow_id: number;
}

export default function MonitoringPage() {
  const { setHeaderExtra } = useLayout();
  const { owner, repo, isConfigured } = useRepository();
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedRunSnapshot, setSelectedRunSnapshot] = useState<WorkflowRun | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'execution' | 'details'>('execution');
  const [isMobile, setIsMobile] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [focusedJobId, setFocusedJobId] = useState<number | null>(null);
  const [focusedStepName, setFocusedStepName] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // 훅 사용
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
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
  const cancelWorkflowRun = useCancelWorkflowRun();

  const workflowsResponse = workflowsData as unknown as { workflows?: any[] } | undefined;
  const runsResponse = workflowRunsData as unknown as
    | { workflow_runs?: WorkflowRun[] }
    | undefined;
  const workflows = Array.isArray(workflowsResponse?.workflows)
    ? (workflowsResponse!.workflows as any[])
    : [];
  const workflowRuns: WorkflowRun[] = Array.isArray(runsResponse?.workflow_runs)
    ? (runsResponse!.workflow_runs as any[])
    : [];

  // 상세: jobs / logs 로드 (선택 시)
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

  // 반응형: 모바일 여부
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    handler(mql);
    const listener = (e: MediaQueryListEvent) => handler(e);
    mql.addEventListener?.('change', listener);
    return () => mql.removeEventListener?.('change', listener);
  }, []);

  const handleShowDetails = (run: WorkflowRun) => {
    setSelectedRun(run);
    setSelectedRunId(run.id);
    setSelectedRunSnapshot(run);
    setActiveTab('execution');
    setFocusedJobId(null);
    setFocusedStepName(null);
    if (isMobile) setIsDetailOpen(true);
    // 데스크톱에서 데이터 리페치로 인한 잠깐의 selectedRun undefined 방지
    // 선택되었을 때는 모달/우측 패널이 유지되도록 상세 오픈 상태는 건드리지 않음
  };

  // 리페치 시에도 선택된 실행을 유지
  useEffect(() => {
    if (!selectedRunId) return;
    const list: WorkflowRun[] = Array.isArray(runsResponse?.workflow_runs)
      ? (runsResponse!.workflow_runs as any[])
      : [];
    const found = list.find((r) => r.id === selectedRunId);
    if (found) {
      setSelectedRun(found);
    } else if (!selectedRun) {
      // 리스트에 없더라도 스냅샷으로 유지
      if (selectedRunSnapshot) setSelectedRun(selectedRunSnapshot);
    }
  }, [workflowRunsData, selectedRunId]);

  // 반응형 전환 시 모바일에서는 선택되어 있으면 모달 자동 오픈
  useEffect(() => {
    if (isMobile && selectedRunId) setIsDetailOpen(true);
  }, [isMobile, selectedRunId]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openInNewWindow = (title: string, content: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const escaped = content
      .replaceAll(/&/g, '&amp;')
      .replaceAll(/</g, '&lt;')
      .replaceAll(/>/g, '&gt;');
    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background:#0f172a; color:#f1f5f9; padding:20px; }
        pre { white-space: pre-wrap; word-break: break-word; border:1px solid #1e293b; border-radius:8px; padding:16px; box-shadow: inset 0 2px 4px rgba(0,0,0,.06); line-height:1.5; }
        .toolbar { display:flex; gap:8px; margin-bottom:12px; }
        .btn { background:#1e293b; color:#e2e8f0; border:1px solid #334155; padding:6px 10px; border-radius:6px; cursor:pointer; }
        .btn:hover { background:#0b1220; }
      </style></head><body>
      <div class="toolbar">
        <button class="btn" onclick="navigator.clipboard.writeText(document.querySelector('pre').innerText)">복사</button>
      </div>
      <pre>${escaped}</pre>
    </body></html>`);
    win.document.close();
  };

  const extractSnippetByKeyword = (text: string, keyword: string, contextLines = 40) => {
    const lines = text.split(/\r?\n/);
    const matches: number[] = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) matches.push(idx);
    });
    if (matches.length === 0) return '';
    const start = Math.max(0, matches[0] - contextLines);
    const end = Math.min(lines.length, matches[0] + contextLines);
    return lines.slice(start, end).join('\n');
  };

  const RunDetail = () => {
    if (!selectedRun) return null;
    const meta = runDetailData?.data || {};
    const metaRows = [
      { k: 'Run ID', v: selectedRun.id },
      { k: 'Workflow', v: selectedRun.name },
      { k: 'Status', v: selectedRun.status },
      { k: 'Conclusion', v: selectedRun.conclusion || '-' },
      { k: 'Created', v: new Date(selectedRun.created_at).toLocaleString() },
      { k: 'Updated', v: new Date(selectedRun.updated_at).toLocaleString() },
      { k: 'Run #', v: selectedRun.run_number },
      { k: 'Repo', v: `${owner}/${repo}` },
      // 확장 가능: meta에서 브랜치/커밋/트리거 등 제공 시 병합
      { k: 'Branch', v: (meta as any)?.head_branch || '-' },
      { k: 'Commit', v: (meta as any)?.head_sha || '-' },
      { k: 'Event', v: (meta as any)?.event || '-' },
    ];
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">실행 상세</div>
              <CardTitle className="text-lg mt-1">
                {selectedRun.name}{' '}
                <span className="text-slate-400">#{selectedRun.run_number}</span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedRun.status, selectedRun.conclusion)}
              {!isMobile && (
                <Button size="sm" variant="outline" onClick={() => setSelectedRun(null)}>
                  닫기
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
            {metaRows.map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white"
              >
                <span className="text-slate-500">{row.k}</span>
                <span className="text-slate-900 font-medium truncate max-w-[65%] text-right">
                  {String(row.v)}
                </span>
              </div>
            ))}
          </div>

          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={(v: string) => setActiveTab(v as 'execution' | 'details')}
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-50">
              <TabsTrigger value="execution">실행 로그</TabsTrigger>
              <TabsTrigger value="details">상세 로그</TabsTrigger>
            </TabsList>

            <TabsContent value="execution" className="space-y-3">
              {jobsLoading ? (
                <div className="text-center py-6 text-gray-500">
                  잡/스텝 불러오는 중...
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(runJobsData) ? runJobsData : []).map((job: any) => (
                    <div key={job.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-900">{job.name}</div>
                        <div className="ml-2">
                          {getStatusBadge(job.status, job.conclusion)}
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2">
                        {(job.steps || []).map((st: any, idx: number) => (
                          <button
                            key={idx}
                            className={`flex items-center justify-between text-[13px] text-left w-full px-2.5 py-1.5 rounded hover:bg-slate-50 border ${
                              focusedJobId === job.id && focusedStepName === st.name
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-transparent'
                            }`}
                            onClick={() => {
                              setFocusedJobId(job.id);
                              setFocusedStepName(st.name);
                              setActiveTab('details');
                            }}
                          >
                            <div className="text-slate-700 flex items-center gap-2">
                              <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-700 border border-slate-200">
                                STEP
                              </span>
                              {st.name}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              {getStepBadge?.(st.status, st.conclusion) || null}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              {logsLoading ? (
                <div className="text-center py-6 text-gray-500">로그 불러오는 중...</div>
              ) : (
                (() => {
                  const rawLog: string =
                    typeof runLogsData === 'string' ? runLogsData : '';
                  const snippet =
                    focusedStepName && rawLog
                      ? extractSnippetByKeyword(rawLog, focusedStepName)
                      : rawLog || '로그가 없습니다.';
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          {focusedStepName ? `필터: ${focusedStepName}` : '전체 로그'}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyText(snippet)}
                          >
                            복사
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              downloadText(`run-${selectedRun?.id}.log`, snippet)
                            }
                          >
                            다운로드
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInNewWindow('Workflow Run Logs', snippet)}
                          >
                            새 창
                          </Button>
                        </div>
                      </div>
                      <div className="bg-slate-900 text-slate-100 font-mono text-[11px] leading-5 p-4 rounded-lg max-h-[480px] overflow-auto border border-slate-800 shadow-inner">
                        <pre className="whitespace-pre-wrap break-words">{snippet}</pre>
                      </div>
                    </div>
                  );
                })()
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  // 헤더 설정
  useEffect(() => {
    setHeaderExtra(
      <div className="flex flex-col gap-0 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 m-0 flex items-center gap-2">
          <Monitor size={20} />
          {ROUTES.MONITORING.label}
        </h1>
        <p className="text-sm text-gray-500 m-0">
          GitHub Actions 워크플로우 실행 로그 모니터링
        </p>
      </div>,
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  const handleCancelRun = async (run: WorkflowRun) => {
    try {
      await cancelWorkflowRun.mutateAsync({
        owner: owner!,
        repo: repo!,
        runId: run.id.toString(),
      });
    } catch (error) {
      console.error('워크플로우 실행 취소 실패:', error);
    }
  };

  const getStatusIcon = (status: string, conclusion?: string) => {
    if (status === 'completed') {
      return conclusion === 'success' ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      );
    } else if (status === 'in_progress') {
      return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />;
    } else if (status === 'waiting') {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, conclusion?: string) => {
    const base = 'border px-2 py-0.5 rounded text-xs font-medium';
    if (status === 'completed') {
      return conclusion === 'success' ? (
        <span className={`${base} bg-green-100 text-green-800 border-green-200`}>
          성공
        </span>
      ) : (
        <span className={`${base} bg-red-100 text-red-800 border-red-200`}>실패</span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className={`${base} bg-blue-100 text-blue-800 border-blue-200`}>
          실행 중
        </span>
      );
    }
    if (status === 'waiting') {
      return (
        <span className={`${base} bg-amber-100 text-amber-800 border-amber-200`}>
          대기 중
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className={`${base} bg-gray-100 text-gray-700 border-gray-200`}>취소</span>
      );
    }
    return (
      <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>기타</span>
    );
  };
  const getStepBadge = (status?: string, conclusion?: string) => {
    const base = 'border px-2 py-0.5 rounded text-[11px] font-medium';
    if (conclusion) {
      if (conclusion === 'success')
        return (
          <span className={`${base} bg-green-100 text-green-800 border-green-200`}>
            성공
          </span>
        );
      if (conclusion === 'failure' || conclusion === 'failed')
        return (
          <span className={`${base} bg-red-100 text-red-800 border-red-200`}>실패</span>
        );
      if (conclusion === 'cancelled')
        return (
          <span className={`${base} bg-gray-100 text-gray-700 border-gray-200`}>
            취소
          </span>
        );
      if (conclusion === 'skipped')
        return (
          <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>
            건너뜀
          </span>
        );
    }
    if (status === 'in_progress')
      return (
        <span className={`${base} bg-blue-100 text-blue-800 border-blue-200`}>
          실행 중
        </span>
      );
    if (status === 'queued' || status === 'waiting')
      return (
        <span className={`${base} bg-amber-100 text-amber-800 border-amber-200`}>
          대기 중
        </span>
      );
    return (
      <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>
        {status || '기타'}
      </span>
    );
  };

  const _getStatusText = (status: string, conclusion?: string) => {
    if (status === 'completed') {
      return conclusion === 'success' ? '성공' : '실패';
    } else if (status === 'in_progress') {
      return '실행 중';
    } else if (status === 'waiting') {
      return '대기 중';
    } else if (status === 'cancelled') {
      return '취소됨';
    }
    return '알 수 없음';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  const getWorkflowRuns = (workflowId: number) => {
    return workflowRuns.filter((run: WorkflowRun) => run.workflow_id === workflowId);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <Monitor className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">로그 모니터링</h2>
          <p className="text-lg text-gray-600 mb-8">
            GitHub Actions 워크플로우의 실행 로그를 실시간으로 모니터링하세요
          </p>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                로그 모니터링을 사용하려면 사이드바에서 GitHub 토큰과 레포지토리를
                설정해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {owner}/{repo}
              </h2>
              <p className="text-gray-600 mt-1">실시간 모니터링 대시보드</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm">
                <Activity className="w-4 h-4 mr-1" />
                {autoRefresh && !autoRefreshPausedDueToDetails ? '실시간' : '일시정지'}
              </Badge>
              <Button
                onClick={() => {
                  refetchWorkflows();
                  refetchRuns();
                }}
                disabled={workflowsLoading || runsLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    workflowsLoading || runsLoading ? 'animate-spin' : ''
                  }`}
                />
                새로고침
              </Button>
              <Button
                onClick={() => setAutoRefresh((v) => !v)}
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
              >
                {autoRefresh ? '자동 새로고침 중지' : '자동 새로고침 시작'}
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 워크플로우</p>
                  <p className="text-2xl font-bold text-blue-600">{workflows.length}</p>
                </div>
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">실행 중</p>
                  <p className="text-2xl font-bold text-green-600">
                    {workflowRuns.filter((r) => r.status === 'in_progress').length}
                  </p>
                </div>
                <Activity className="w-6 h-6 text-green-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">성공률</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {workflowRuns.length > 0
                      ? Math.round(
                          (workflowRuns.filter(
                            (r) => r.status === 'completed' && r.conclusion === 'success',
                          ).length /
                            workflowRuns.length) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">실패</p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      workflowRuns.filter(
                        (r) => r.status === 'completed' && r.conclusion !== 'success',
                      ).length
                    }
                  </p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2열 레이아웃: 좌측 목록 / 우측 상세 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">최근 실행</TabsTrigger>
                <TabsTrigger value="workflows">워크플로우별</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      최근 워크플로우 실행
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {runsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">데이터를 불러오는 중...</p>
                      </div>
                    ) : workflowRuns.length === 0 ? (
                      <div className="text-center py-8">
                        <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          실행 기록이 없습니다
                        </h3>
                        <p className="text-gray-600 mb-4">
                          아직 워크플로우가 실행되지 않았습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workflowRuns.slice(0, 10).map((run) => (
                          <Card
                            key={run.id}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {getStatusIcon(run.status, run.conclusion)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate">
                                      {run.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      #{run.run_number} • {getTimeAgo(run.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(run.status, run.conclusion)}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleShowDetails(run)}
                                  >
                                    <Info className="w-4 h-4 mr-2" />
                                    상세보기
                                  </Button>
                                  {run.status === 'in_progress' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelRun(run)}
                                      disabled={cancelWorkflowRun.isPending}
                                    >
                                      {cancelWorkflowRun.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <X className="w-4 h-4 mr-2" />
                                      )}
                                      취소
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workflows" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      워크플로우별 상태
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workflowsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">워크플로우를 불러오는 중...</p>
                      </div>
                    ) : workflows.length === 0 ? (
                      <div className="text-center py-8">
                        <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          워크플로우가 없습니다
                        </h3>
                        <p className="text-gray-600 mb-4">
                          이 레포지토리에 워크플로우가 없습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workflows.map((workflow) => {
                          const workflowRuns = getWorkflowRuns(workflow.id);
                          const recentRun = workflowRuns[0];

                          return (
                            <Card
                              key={workflow.id}
                              className="hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(workflow.state)}
                                    <h4 className="font-semibold text-gray-900">
                                      {workflow.name}
                                    </h4>
                                  </div>
                                  {getStatusBadge(workflow.state)}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  {workflow.path}
                                </p>

                                {recentRun && (
                                  <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">최근 실행:</span>
                                      <span className="text-gray-700">
                                        #{recentRun.run_number} •{' '}
                                        {getTimeAgo(recentRun.created_at)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-gray-600">상태:</span>
                                      {getStatusBadge(
                                        recentRun.status,
                                        recentRun.conclusion,
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    마지막 업데이트:{' '}
                                    {new Date(workflow.updatedAt).toLocaleDateString()}
                                  </span>
                                  <Button size="sm" variant="outline">
                                    <Play className="w-4 h-4 mr-2" />
                                    실행
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:block sticky top-4 self-start">
            {selectedRun ? (
              <RunDetail />
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">실행 상세</div>
                  <div className="text-sm">
                    좌측에서 실행을 선택하면 이 영역에 상세 정보가 표시됩니다.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 태블릿 전용(768~1023px): 상세 패널을 리스트 아래에 인라인 렌더링 */}
        <div className="hidden md:block lg:hidden">
          {selectedRun ? (
            <RunDetail />
          ) : (
            <Card className="border-dashed mt-4">
              <CardContent className="p-10 text-center text-gray-500">
                <div className="text-lg font-medium mb-2">실행 상세</div>
                <div className="text-sm">
                  좌측에서 실행을 선택하면 이 영역에 상세 정보가 표시됩니다.
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 모바일 상세: 모달 */}
        <Dialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            // 모바일에서만 모달 사용
            if (!isMobile) {
              setIsDetailOpen(false);
              return;
            }
            setIsDetailOpen(open);
          }}
        >
          <DialogContent className="sm:max-w-3xl w-[95vw] p-0" showCloseButton>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>실행 상세</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <RunDetail />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
