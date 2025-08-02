"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useWorkflows,
  usePipeline,
  useUpdatePipeline,
} from "@/hooks/useWorkflows";
import { WorkflowItem } from "@/api/githubClient";
import { useRepository } from "@/contexts/RepositoryContext";

export default function WorkflowManager() {
  const { owner, repo } = useRepository();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(
    null
  );

  // * React Query 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useWorkflows(owner || "", repo || "");
  const {
    data: pipelineData,
    isLoading: pipelineLoading,
    error: pipelineError,
  } = usePipeline(
    selectedWorkflow?.fileName || selectedWorkflow?.name || "",
    owner || "",
    repo || ""
  );
  const updatePipelineMutation = useUpdatePipeline();

  const workflows = workflowsData?.data?.workflows || [];
  const loading =
    workflowsLoading || pipelineLoading || updatePipelineMutation.isPending;
  const error = workflowsError || pipelineError || updatePipelineMutation.error;

  // * 워크플로우 선택
  const handleWorkflowSelect = (workflow: WorkflowItem) => {
    setSelectedWorkflow(workflow);
  };

  // * 파이프라인 업데이트
  const handlePipelineUpdate = async () => {
    if (!pipelineData?.data || !owner || !repo) return;

    try {
      await updatePipelineMutation.mutateAsync({
        owner,
        repo,
        workflowName: pipelineData.data.workflowName,
        inputJson: pipelineData.data.originalJson,
        description: "",
      });
      alert("파이프라인이 성공적으로 업데이트되었습니다.");
    } catch (err) {
      console.error("파이프라인 업데이트 실패:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 워크플로우 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>워크플로우 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-4">로딩 중...</div>}
          {error && (
            <div className="text-red-600 text-center py-4">
              오류가 발생했습니다: {error.toString()}
            </div>
          )}
          {!loading && !error && workflows.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              워크플로우가 없습니다.
            </div>
          )}
          {!loading && !error && workflows.length > 0 && (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => handleWorkflowSelect(workflow)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-gray-600">{workflow.path}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            workflow.state === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {workflow.state}
                        </Badge>
                        {workflow.manualDispatchEnabled && (
                          <Badge variant="outline">수동 실행 가능</Badge>
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

      {/* 선택된 워크플로우 상세 정보 */}
      {selectedWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle>선택된 워크플로우: {selectedWorkflow.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">파일 경로:</span>{" "}
                  {selectedWorkflow.path}
                </div>
                <div>
                  <span className="font-medium">상태:</span>{" "}
                  <Badge
                    variant={
                      selectedWorkflow.state === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedWorkflow.state}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">생성일:</span>{" "}
                  {new Date(selectedWorkflow.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">수정일:</span>{" "}
                  {new Date(selectedWorkflow.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <Separator />

              {/* 파이프라인 데이터 */}
              {pipelineLoading && (
                <div className="text-center py-4">
                  파이프라인 데이터 로딩 중...
                </div>
              )}
              {pipelineError && (
                <div className="text-red-600 text-center py-4">
                  파이프라인 데이터 로드 실패: {pipelineError.toString()}
                </div>
              )}
              {pipelineData?.data && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">파이프라인 구성</h4>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(
                          pipelineData.data.originalJson,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">YAML 내용</h4>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                        {pipelineData.data.yamlContent}
                      </pre>
                    </div>
                  </div>

                  <Button
                    onClick={handlePipelineUpdate}
                    disabled={updatePipelineMutation.isPending}
                    className="w-full"
                  >
                    {updatePipelineMutation.isPending
                      ? "업데이트 중..."
                      : "파이프라인 업데이트"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
