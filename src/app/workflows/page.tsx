"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLayout } from "@/components/layout/LayoutContext";
import { useRepository } from "@/contexts/RepositoryContext";
import {
  useWorkflows,
  useWorkflowRuns,
  useDispatchWorkflow,
} from "@/api/hooks";
import { WorkflowItem } from "@/api/types";
import {
  Workflow,
  Search,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  GitBranch,
  RefreshCw,
  Filter,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { ROUTES } from "@/config/appConstants";

export default function WorkflowsPage() {
  const { setHeaderExtra } = useLayout();
  const { owner, repo, isConfigured } = useRepository();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(
    null
  );

  // 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
  } = useWorkflows(owner || "", repo || "");
  const { data: workflowRunsData, isLoading: runsLoading } = useWorkflowRuns(
    owner || "",
    repo || ""
  );
  const dispatchWorkflow = useDispatchWorkflow();

  const workflows = workflowsData?.data?.workflows || [];
  const workflowRuns = workflowRunsData?.data?.workflow_runs || [];

  // 헤더 설정
  useEffect(() => {
    setHeaderExtra(
      <div className="flex flex-col gap-0 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 m-0 flex items-center gap-2">
          <Workflow size={20} />
          {ROUTES.WORKFLOWS.label}
        </h1>
        <p className="text-sm text-gray-500 m-0">
          GitHub Actions 워크플로우 관리 및 실행
        </p>
      </div>
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  // 워크플로우 필터링
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      searchTerm === "" ||
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.path.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === "all" || workflow.state === activeTab;

    return matchesSearch && matchesTab;
  });

  const handleDispatchWorkflow = async (workflow: WorkflowItem) => {
    if (!owner || !repo) return;

    try {
      await dispatchWorkflow.mutateAsync({
        owner,
        repo,
        ymlFileName: workflow.path.split("/").pop() || workflow.name,
        ref: "main", // 기본 브랜치
      });
    } catch (error) {
      console.error("워크플로우 실행 실패:", error);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "inactive":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            활성
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">비활성</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getWorkflowRuns = (workflowId: number) => {
    return workflowRuns.filter((run: any) => run.workflow_id === workflowId);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <Workflow className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            워크플로우 관리
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            GitHub 레포지토리의 워크플로우를 관리하고 실행하세요
          </p>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                워크플로우 관리를 사용하려면 사이드바에서 GitHub 토큰과
                레포지토리를 설정해주세요.
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
              <p className="text-gray-600 mt-1">GitHub 레포지토리</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm">
                <GitBranch className="w-4 h-4 mr-1" />
                {workflows.length} 워크플로우
              </Badge>
              <Button
                onClick={() => refetchWorkflows()}
                disabled={workflowsLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    workflowsLoading ? "animate-spin" : ""
                  }`}
                />
                새로고침
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드 - 최상단으로 이동 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    총 워크플로우
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {workflows.length}
                  </p>
                </div>
                <Workflow className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성</p>
                  <p className="text-2xl font-bold text-green-600">
                    {workflows.filter((w) => w.state === "active").length}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">비활성</p>
                  <p className="text-2xl font-bold text-red-600">
                    {workflows.filter((w) => w.state === "inactive").length}
                  </p>
                </div>
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">수동 실행</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {workflows.filter((w) => w.manualDispatchEnabled).length}
                  </p>
                </div>
                <Play className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 검색 입력창 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="워크플로우 이름이나 경로로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* 필터 탭 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    상태별 필터:
                  </span>
                </div>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="all">
                      전체 ({workflows.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                      활성 (
                      {workflows.filter((w) => w.state === "active").length})
                    </TabsTrigger>
                    <TabsTrigger value="inactive">
                      비활성 (
                      {workflows.filter((w) => w.state === "inactive").length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 검색 결과 표시 */}
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                &ldquo;{searchTerm}&rdquo; 검색 결과: {filteredWorkflows.length}
                개 워크플로우
              </span>
            </div>
          </div>
        )}

        {/* 워크플로우 목록 */}
        <div className="space-y-4">
          {workflowsLoading ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">워크플로우를 불러오는 중...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm
                      ? "검색 결과가 없습니다"
                      : "워크플로우가 없습니다"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? `&ldquo;${searchTerm}&rdquo;에 대한 검색 결과가 없습니다.`
                      : "이 레포지토리에 워크플로우가 없습니다."}
                  </p>
                  {searchTerm ? (
                    <Button onClick={clearSearch} variant="outline">
                      검색 초기화
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/github-actions-flow">워크플로우 생성</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredWorkflows.map((workflow) => {
                const workflowRuns = getWorkflowRuns(workflow.id);
                const recentRun = workflowRuns[0];

                return (
                  <Card
                    key={workflow.id}
                    className="hover:shadow-lg transition-all duration-200"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(workflow.state)}
                            <h3 className="font-semibold text-gray-900 truncate">
                              {workflow.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {workflow.path}
                          </p>
                        </div>
                        {getStatusBadge(workflow.state)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>마지막 업데이트</span>
                          <span>
                            {new Date(workflow.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {recentRun && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">최근 실행</span>
                            <span className="text-gray-700">
                              #{recentRun.run_number} •{" "}
                              {new Date(
                                recentRun.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {workflow.manualDispatchEnabled && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Play className="w-4 h-4" />
                            수동 실행 가능
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDispatchWorkflow(workflow)}
                            disabled={dispatchWorkflow.isPending}
                          >
                            {dispatchWorkflow.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            실행
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            실행 기록
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
