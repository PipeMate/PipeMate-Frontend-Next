'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLayout } from '@/components/layout/LayoutContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useWorkflows, useWorkflowRuns, useDispatchWorkflow } from '@/api/hooks';
import { WorkflowItem } from '@/api/types';
import {
  LoadingSpinner,
  EmptyState,
  WorkflowStatusBadge,
  IconBadge,
} from '@/components/ui';
import {
  Workflow,
  GitBranch,
  Play,
  Search,
  Filter,
  RefreshCw,
  Edit,
  X,
} from 'lucide-react';
import { ROUTES } from '@/config/appConstants';
import { useRouter } from 'next/navigation';

export default function WorkflowsPage() {
  const { setHeaderExtra, setHeaderRight } = useLayout();
  const { owner, repo, isConfigured } = useRepository();
  const WorkflowsIcon = ROUTES.WORKFLOWS.icon;
  const [searchTerm, setSearchTerm] = useState('');
  const [_selectedWorkflow] = useState<WorkflowItem | null>(null);
  const router = useRouter();

  // 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
  } = useWorkflows(owner || '', repo || '');
  const { data: workflowRunsData, isLoading: _runsLoading } = useWorkflowRuns(
    owner || '',
    repo || '',
  );
  const dispatchWorkflow = useDispatchWorkflow();

  const workflows = workflowsData?.workflows || [];
  const runsResponse = workflowRunsData as unknown as
    | { workflow_runs?: any[] }
    | undefined;
  const workflowRuns = Array.isArray(runsResponse?.workflow_runs)
    ? (runsResponse!.workflow_runs as any[])
    : [];

  // 헤더 설정(좌측 타이틀, 우측 컨트롤 분리)
  useEffect(() => {
    setHeaderExtra(
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex items-center justify-center rounded-md bg-blue-100 text-blue-700 p-2">
          <WorkflowsIcon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <div className="text-base md:text-lg font-semibold text-slate-900 leading-tight">
            {ROUTES.WORKFLOWS.label}
          </div>
          <div className="text-xs md:text-sm text-slate-500 truncate">
            {owner && repo ? (
              <span className="text-slate-700">
                {owner}/{repo}
              </span>
            ) : (
              'GitHub Actions 워크플로우 관리 및 실행'
            )}
          </div>
        </div>
      </div>,
    );
    setHeaderRight(
      <div className="flex items-center gap-2.5">
        <IconBadge icon={<GitBranch className="w-4 h-4" />} variant="outline" size="sm">
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
      setHeaderExtra(null);
      setHeaderRight(null);
    };
  }, [
    setHeaderExtra,
    setHeaderRight,
    owner,
    repo,
    workflows.length,
    workflowsLoading,
    refetchWorkflows,
    WorkflowsIcon,
  ]);

  // 워크플로우 필터링
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      searchTerm === '' ||
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.path.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = true; // 모든 탭에 대해 필터링

    return matchesSearch && matchesTab;
  });

  const handleDispatchWorkflow = async (workflow: WorkflowItem) => {
    if (!owner || !repo) return;

    try {
      await dispatchWorkflow.mutateAsync({
        owner,
        repo,
        ymlFileName: workflow.path.split('/').pop() || workflow.name,
        ref: 'main', // 기본 브랜치
      });
    } catch (error) {
      console.error('워크플로우 실행 실패:', error);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const navigateToEdit = (workflow: WorkflowItem) => {
    const fileName = workflow.fileName || workflow.path.split('/').pop() || workflow.name;
    router.push(`/workflows/edit?file=${encodeURIComponent(fileName)}`);
  };

  const getWorkflowRuns = (workflowId: number) => {
    return workflowRuns.filter((run: any) => run.workflow_id === workflowId);
  };

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
    <div className="min-h-full bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* 검색 및 필터 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                필터
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 워크플로우 목록 */}
        <Card>
          <CardHeader>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="active">활성</TabsTrigger>
                <TabsTrigger value="inactive">비활성</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <LoadingSpinner message="워크플로우를 불러오는 중..." />
            ) : filteredWorkflows.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((workflow) => {
                  const runs = getWorkflowRuns(workflow.id);
                  const recentRun = runs[0];

                  return (
                    <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {workflow.name}
                          </h3>
                          <WorkflowStatusBadge status={workflow.state} size="sm" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{workflow.path}</p>

                        {recentRun && (
                          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">최근 실행:</span>
                              <WorkflowStatusBadge
                                status={recentRun.conclusion || recentRun.status}
                                size="sm"
                              />
                            </div>
                            <div className="text-gray-500 mt-1">
                              {new Date(recentRun.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(workflow.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigateToEdit(workflow)}
                              title="워크플로우 편집"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDispatchWorkflow(workflow)}
                              disabled={dispatchWorkflow.isPending}
                              title="워크플로우 실행"
                            >
                              <Play className="w-4 h-4" />
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
