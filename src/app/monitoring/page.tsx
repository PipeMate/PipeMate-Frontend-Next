'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLayout } from '@/components/layout/LayoutContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useWorkflows, useWorkflowRuns, useCancelWorkflowRun } from '@/api/hooks';
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
  const [_selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  // 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
  } = useWorkflows(owner || '', repo || '');
  const {
    data: workflowRunsData,
    isLoading: runsLoading,
    refetch: refetchRuns,
  } = useWorkflowRuns(owner || '', repo || '');
  const cancelWorkflowRun = useCancelWorkflowRun();

  const workflows = workflowsData?.data?.workflows || [];
  const workflowRuns: WorkflowRun[] = workflowRunsData?.data?.workflow_runs || [];

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
    if (status === 'completed') {
      return conclusion === 'success' ? (
        <Badge variant="default" className="bg-green-100 text-green-800">
          성공
        </Badge>
      ) : (
        <Badge variant="destructive">실패</Badge>
      );
    } else if (status === 'in_progress') {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          실행 중
        </Badge>
      );
    } else if (status === 'waiting') {
      return <Badge variant="secondary">대기 중</Badge>;
    } else {
      return <Badge variant="outline">알 수 없음</Badge>;
    }
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
                실시간
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

        {/* 모니터링 탭 */}
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
                      <Card key={run.id} className="hover:shadow-md transition-shadow">
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
                                onClick={() => setSelectedRun(run)}
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
                            <p className="text-sm text-gray-600 mb-3">{workflow.path}</p>

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
                                  {getStatusBadge(recentRun.status, recentRun.conclusion)}
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
    </div>
  );
}
