'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePageHeader } from '@/components/layout';
import { useRepository } from '@/contexts/RepositoryContext';
import type { WorkflowItem } from '@/api';
import { useDispatchWorkflow, useWorkflowRuns, useWorkflows } from '@/api';
import {
  EmptyState,
  IconBadge,
  LoadingSpinner,
  WorkflowStatusBadge,
} from '@/components/ui';
import {
  Activity,
  ArrowUpDown,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  GitBranch,
  Home,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { ROUTES } from '@/config/appConstants';
import { useRouter } from 'next/navigation';
import { useSetupGuard } from '@/hooks/useSetupGuard';
import { FullScreenLoading } from '@/components/ui';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// * 워크플로우 타입별 색상 스키마
const getWorkflowColorScheme = (workflow: WorkflowItem) => {
  const name = workflow.name.toLowerCase();

  if (name.includes('ci') || name.includes('build')) {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600',
    };
  }

  if (name.includes('deploy') || name.includes('monitor')) {
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-600',
    };
  }

  if (name.includes('test')) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      icon: 'text-purple-600',
    };
  }

  if (name.includes('scheduled') || name.includes('check')) {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'text-orange-600',
    };
  }

  // * 기본 스타일
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-600',
  };
};

// * 날짜 포맷팅 유틸리티
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return '방금 전';
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInHours < 168) {
    // * 7일
    return `${Math.floor(diffInHours / 24)}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
};

export default function WorkflowsPage() {
  const { setPageHeader, setPageActions, clearPageHeader } = usePageHeader();
  const { owner, repo, isConfigured } = useRepository();
  const WorkflowsIcon = ROUTES.WORKFLOWS.icon;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [executingWorkflows, setExecutingWorkflows] = useState<Set<number>>(new Set());
  const router = useRouter();

  // * 설정 가드
  const { isChecking, isSetupValid } = useSetupGuard({
    requireToken: true,
    requireRepository: true,
    redirectTo: '/setup',
    onSetupChange: (tokenExists, repositoryExists) => {
      if (!tokenExists || !repositoryExists) {
        router.push('/setup');
      }
    },
  });

  // * API 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
  } = useWorkflows(owner || '', repo || '');
  const { data: workflowRunsData, isLoading: runsLoading } = useWorkflowRuns(
    owner || '',
    repo || '',
  );
  const dispatchWorkflow = useDispatchWorkflow();

  const workflows = workflowsData?.workflows || [];
  const runsResponse = workflowRunsData as unknown as
    | { workflow_runs?: any[] }
    | undefined;
  const workflowRuns = Array.isArray(runsResponse?.workflow_runs)
    ? runsResponse!.workflow_runs
    : [];

  // * 필터링 및 정렬된 워크플로우
  const filteredAndSortedWorkflows = useMemo(() => {
    const filtered = workflows.filter((workflow) => {
      const matchesSearch =
        searchTerm === '' ||
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.path.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // * 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [workflows, searchTerm, sortBy]);

  // * 페이지 헤더 설정
  useEffect(() => {
    setPageHeader({
      title: ROUTES.WORKFLOWS.label,
      description: 'GitHub Actions 워크플로우 관리 및 실행',
      breadcrumbs: [
        { label: '홈', href: '/', icon: Home },
        { label: ROUTES.WORKFLOWS.label, icon: WorkflowsIcon },
      ],
      badges: [
        {
          label: `${workflows.length} 워크플로우`,
          variant: 'secondary',
          color: 'blue',
        },
      ],
    });

    setPageActions(
      <div className="flex items-center gap-2">
        <IconBadge icon={<Activity className="w-4 h-4" />} variant="outline" size="sm">
          {workflows.length} 워크플로우
        </IconBadge>
        <Button
          onClick={() => refetchWorkflows()}
          disabled={workflowsLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${workflowsLoading ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>
      </div>,
    );

    return () => {
      clearPageHeader();
    };
  }, [
    setPageHeader,
    setPageActions,
    clearPageHeader,
    workflows.length,
    workflowsLoading,
    refetchWorkflows,
  ]);

  // * 워크플로우 실행 핸들러
  const handleDispatchWorkflow = async (workflow: WorkflowItem) => {
    if (!owner || !repo) {
      toast.error('저장소 정보가 없습니다.');
      return;
    }

    if (!workflow.manual_dispatch_enabled) {
      toast.error('이 워크플로우는 수동 실행이 불가능합니다.');
      return;
    }

    // * 실행 중 상태 추가
    setExecutingWorkflows((prev) => new Set(prev).add(workflow.id));

    try {
      const ymlFileName =
        workflow.fileName || workflow.path.split('/').pop() || workflow.name;
      const ref = workflow.available_branches?.[0] || 'main';

      console.log('워크플로우 실행 시도:', {
        owner,
        repo,
        ymlFileName,
        ref,
        workflowName: workflow.name,
      });

      await dispatchWorkflow.mutateAsync({
        owner,
        repo,
        ymlFileName,
        ref,
      });

      toast.success(`워크플로우 "${workflow.name}" 실행이 시작되었습니다!`);

      // * 워크플로우 목록 새로고침
      setTimeout(() => {
        refetchWorkflows();
      }, 1000);
    } catch (error: any) {
      console.error('워크플로우 실행 실패:', error);

      let errorMessage = '워크플로우 실행에 실패했습니다.';

      if (error?.response?.status === 404) {
        errorMessage = '워크플로우 파일을 찾을 수 없습니다.';
      } else if (error?.response?.status === 403) {
        errorMessage = '워크플로우 실행 권한이 없습니다.';
      } else if (error?.response?.status === 422) {
        errorMessage = '워크플로우 설정에 문제가 있습니다.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      // * 실행 중 상태 제거
      setExecutingWorkflows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(workflow.id);
        return newSet;
      });
    }
  };

  // * 편집 페이지로 이동
  const navigateToEdit = (workflow: WorkflowItem) => {
    const fileName = workflow.fileName || workflow.path.split('/').pop() || workflow.name;
    router.push(`/workflows/edit?file=${encodeURIComponent(fileName)}`);
  };

  // * 워크플로우별 실행 기록 가져오기
  const getWorkflowRuns = (workflowId: number) => {
    return workflowRuns.filter((run: any) => run.workflow_id === workflowId);
  };

  // * 설정이 유효하지 않으면 로딩 표시
  if (isChecking || !isSetupValid) {
    return <FullScreenLoading />;
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <Workflow className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">워크플로우 관리</h2>
          <p className="text-lg text-gray-600 mb-8">
            GitHub 레포지토리의 워크플로우를 관리하고 실행하세요
          </p>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                워크플로우 관리를 사용하려면 사이드바에서 GitHub 토큰과 레포지토리를
                설정해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* 검색 및 정렬 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="워크플로우 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'updated' | 'created' | 'name')
                  }
                  className="text-sm border rounded px-3 py-2 bg-background"
                >
                  <option value="updated">최근 수정</option>
                  <option value="created">생성일</option>
                  <option value="name">이름순</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 워크플로우 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>워크플로우 목록</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                {filteredAndSortedWorkflows.length}개 표시
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <LoadingSpinner message="워크플로우를 불러오는 중..." />
            ) : filteredAndSortedWorkflows.length === 0 ? (
              <EmptyState
                icon={Workflow}
                title="워크플로우가 없습니다"
                description={
                  searchTerm
                    ? `"${searchTerm}"에 대한 검색 결과가 없습니다.`
                    : '이 레포지토리에 워크플로우가 없습니다.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedWorkflows.map((workflow) => {
                  const runs = getWorkflowRuns(workflow.id);
                  const recentRun = runs[0];
                  const colorScheme = getWorkflowColorScheme(workflow);
                  const isExecuting = executingWorkflows.has(workflow.id);

                  return (
                    <Card
                      key={workflow.id}
                      className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${colorScheme.bg} ${colorScheme.border}`}
                      onClick={() => navigateToEdit(workflow)}
                    >
                      <CardContent className="p-6">
                        {/* 헤더 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className={`w-5 h-5 ${colorScheme.icon}`} />
                              <h3 className="font-semibold text-foreground truncate">
                                {workflow.fileName || workflow.name.split('/').pop()}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {workflow.path}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <WorkflowStatusBadge status={workflow.state} size="sm" />
                            {workflow.manual_dispatch_enabled && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                수동 실행
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 메타 정보 */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>생성: {formatDate(workflow.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>수정: {formatDate(workflow.updated_at)}</span>
                          </div>
                          {workflow.available_branches &&
                            workflow.available_branches.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <GitBranch className="w-3 h-3" />
                                <span>
                                  브랜치: {workflow.available_branches.join(', ')}
                                </span>
                              </div>
                            )}
                        </div>

                        {/* 최근 실행 정보 */}
                        {recentRun && (
                          <div className="mb-4 p-3 bg-card rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-foreground">
                                최근 실행
                              </span>
                              <WorkflowStatusBadge
                                status={recentRun.conclusion || recentRun.status}
                                size="sm"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(recentRun.created_at)}
                            </div>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToEdit(workflow);
                            }}
                            title="워크플로우 편집"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            편집
                          </Button>

                          <div className="flex items-center gap-2">
                            {workflow.manual_dispatch_enabled && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDispatchWorkflow(workflow);
                                }}
                                disabled={isExecuting || dispatchWorkflow.isPending}
                                className="text-green-700 border-green-300 hover:bg-green-50"
                                title="워크플로우 실행"
                              >
                                {isExecuting ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4 mr-1" />
                                )}
                                {isExecuting ? '실행 중...' : '실행'}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(workflow.html_url, '_blank');
                              }}
                              className="text-blue-700 border-blue-300 hover:bg-blue-50"
                              title="GitHub에서 보기"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
