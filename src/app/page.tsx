"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRepository } from "@/contexts/RepositoryContext";
import { workflowAPI, pipelineAPI } from "@/api/githubClient";
import { WorkflowItem } from "@/api/types";
import { useDispatchWorkflow } from "@/api/hooks/useWorkflows";
import {
  Workflow,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Settings,
  Monitor,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { owner, repo, isConfigured } = useRepository();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    recentRuns: 0,
  });

  // 워크플로우 실행 뮤테이션
  const dispatchWorkflow = useDispatchWorkflow();

  // 워크플로우 실행 함수
  const handleDispatchWorkflow = async (workflow: WorkflowItem) => {
    if (!owner || !repo) return;

    try {
      // 파일명에서 .yml 확장자 제거
      const ymlFileName = workflow.path.replace(".github/workflows/", "");

      await dispatchWorkflow.mutateAsync({
        owner,
        repo,
        ymlFileName,
        ref: "main", // 기본 브랜치
      });

      alert("워크플로우가 성공적으로 실행되었습니다!");
    } catch (error) {
      console.error("워크플로우 실행 실패:", error);

      alert(
        "워크플로우 실행에 실패했습니다. workflow_dispatch가 설정되어 있지 않을 수 있습니다."
      );
    }
  };

  useEffect(() => {
    if (isConfigured && owner && repo) {
      loadWorkflows();
    }
  }, [isConfigured, owner, repo]);

  const loadWorkflows = async () => {
    if (!owner || !repo) return;

    setLoading(true);
    try {
      const response = await workflowAPI.getList(owner, repo);
      const workflowsData = response.data.workflows || [];

      setWorkflows(workflowsData);

      // 통계 계산
      setStats({
        totalWorkflows: workflowsData.length,
        activeWorkflows: workflowsData.filter((w) => w.state === "active")
          .length,
        recentRuns: 0, // 추후 워크플로우 실행 데이터로 업데이트
      });
    } catch (error) {
      console.error("워크플로우 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PipeMate
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                GitHub Actions 워크플로우를 시각적으로 관리하고 모니터링하는
                강력한 도구입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Workflow className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <CardTitle>워크플로우 관리</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    GitHub Actions 워크플로우를 시각적으로 편집하고 관리하세요.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Monitor className="w-12 h-12 mx-auto text-green-600 mb-4" />
                  <CardTitle>실시간 모니터링</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    워크플로우 실행 상태와 로그를 실시간으로 모니터링하세요.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Settings className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                  <CardTitle>프리셋 관리</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    자주 사용하는 워크플로우 템플릿을 프리셋으로 관리하세요.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">시작하기</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">
                    사용을 시작하려면 사이드바에서 GitHub 토큰과 레포지토리를
                    설정해주세요.
                  </p>
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href="/workflows">워크플로우 관리 시작</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {owner}/{repo}
              </h1>
              <p className="text-gray-600 mt-2">
                GitHub Actions 워크플로우 대시보드
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                <GitBranch className="w-4 h-4 mr-1" />
                Repository
              </Badge>
              <Button variant="outline" size="sm">
                🔍 토큰 확인
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    총 워크플로우
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? "..." : stats.totalWorkflows}
                  </p>
                </div>
                <Workflow className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    활성 워크플로우
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {loading ? "..." : stats.activeWorkflows}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">최근 실행</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {loading ? "..." : stats.recentRuns}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 워크플로우 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>워크플로우 목록</CardTitle>
              <Button asChild size="sm">
                <Link href="/workflows">전체 보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">
                  워크플로우를 불러오는 중...
                </p>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8">
                <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">워크플로우가 없습니다.</p>
                <Button asChild className="mt-4">
                  <Link href="/github-actions-flow">워크플로우 생성</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.slice(0, 6).map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {workflow.name}
                        </h3>
                        <Badge
                          variant={
                            workflow.state === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {workflow.state}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {workflow.path}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(workflow.updatedAt).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDispatchWorkflow(workflow)}
                          disabled={dispatchWorkflow.isPending}
                          title="워크플로우 실행"
                        >
                          {dispatchWorkflow.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          {dispatchWorkflow.isPending ? "실행 중..." : "실행"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                모니터링
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                워크플로우 실행 상태와 로그를 실시간으로 모니터링하세요.
              </p>
              <Button asChild>
                <Link href="/monitoring">모니터링 시작</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                프리셋
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                자주 사용하는 워크플로우 템플릿을 프리셋으로 관리하세요.
              </p>
              <Button asChild>
                <Link href="/presets">프리셋 관리</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
