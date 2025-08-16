'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  LoadingSpinner,
  ErrorMessage,
  SetupRequiredEmptyState,
  WorkflowStatusBadge,
} from '@/components/ui';
import { useWorkflows, usePipeline, useUpdatePipeline } from '@/api';
import { WorkflowItem } from '@/api';
import { useRepository } from '@/contexts/RepositoryContext';
import { GithubTokenDialog } from './GithubTokenDialog';

export default function WorkflowManager() {
  const { owner, repo, isConfigured } = useRepository();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);

  // * React Query 훅 사용
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useWorkflows(owner || '', repo || '');
  const {
    data: pipelineData,
    isLoading: pipelineLoading,
    error: pipelineError,
  } = usePipeline(
    selectedWorkflow?.fileName || selectedWorkflow?.name || '',
    owner || '',
    repo || '',
  );
  const updatePipelineMutation = useUpdatePipeline();

  const workflows = workflowsData?.workflows || [];
  const loading = workflowsLoading || pipelineLoading || updatePipelineMutation.isPending;
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
        description: '',
      });
      alert('파이프라인이 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error('파이프라인 업데이트 실패:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 설정 안내 메시지 */}
      {!isConfigured && (
        <SetupRequiredEmptyState
          action={
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                GitHub 워크플로우를 조회하려면 다음 설정이 필요합니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>GitHub Personal Access Token</li>
                <li>Repository Owner (사용자명 또는 조직명)</li>
                <li>Repository Name</li>
              </ul>
              <div className="mt-4">
                <GithubTokenDialog />
              </div>
            </div>
          }
        />
      )}

      {/* 워크플로우 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>워크플로우 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">위의 설정을 완료해주세요.</p>
            </div>
          )}

          {isConfigured && loading && (
            <LoadingSpinner message="워크플로우를 불러오는 중..." />
          )}

          {isConfigured && error && (
            <ErrorMessage
              message="워크플로우 목록을 불러오는데 실패했습니다."
              onRetry={() => window.location.reload()}
            />
          )}

          {isConfigured && !loading && !error && workflows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>워크플로우가 없습니다.</p>
            </div>
          )}

          {isConfigured && !loading && !error && workflows.length > 0 && (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleWorkflowSelect(workflow)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                      <p className="text-sm text-gray-500">{workflow.path}</p>
                    </div>
                    <WorkflowStatusBadge status={workflow.state} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 선택된 워크플로우 상세 정보 */}
      {selectedWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle>워크플로우 상세 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedWorkflow.name}</h3>
                <p className="text-sm text-gray-500">{selectedWorkflow.path}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">상태:</span>
                  <div className="mt-1">
                    <WorkflowStatusBadge status={selectedWorkflow.state} />
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">파일명:</span>
                  <p className="text-gray-600">{selectedWorkflow.fileName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">생성일:</span>
                  <p className="text-gray-600">
                    {new Date(selectedWorkflow.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">수정일:</span>
                  <p className="text-gray-600">
                    {new Date(selectedWorkflow.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {pipelineData?.data && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">파이프라인 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">YAML 내용:</span>
                      </p>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
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
                      ? '업데이트 중...'
                      : '파이프라인 업데이트'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
