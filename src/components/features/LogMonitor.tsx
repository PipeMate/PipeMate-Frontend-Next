'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  LoadingSpinner,
  ErrorMessage,
  WorkflowStatusBadge,
  JobStatusBadge,
} from '@/components/ui';
import { workflowUtils } from '@/lib/githubActions';
import { useRepository } from '@/contexts/RepositoryContext';

interface WorkflowRun {
  id: string;
  name: string;
  status: string;
  conclusion: string;
  created_at: string;
  updated_at: string;
  run_number: number;
}

interface JobDetail {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  steps: {
    name: string;
    status: string;
    conclusion: string;
    startedAt: string;
    completedAt: string;
  }[];
}

export default function LogMonitor() {
  const { owner, repo } = useRepository();
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // * 워크플로우 실행 목록 조회
  const fetchWorkflowRuns = useCallback(async () => {
    if (!owner || !repo) return;

    setLoading(true);
    setError(null);

    try {
      const result = await workflowUtils.getWorkflowRuns(owner, repo);
      if (result.success && result.data) {
        setWorkflowRuns(result.data.workflow_runs || []);
      } else {
        setError('워크플로우 실행 목록을 불러오는데 실패했습니다.');
      }
    } catch {
      setError('워크플로우 실행 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  // * 특정 실행의 Job 상세 정보 조회
  const fetchJobDetails = useCallback(
    async (runId: string) => {
      if (!owner || !repo) return;

      setLoading(true);
      setError(null);

      try {
        const result = await workflowUtils.getWorkflowRunJobs(owner, repo, runId);
        if (result.success && result.data) {
          setJobDetails(result.data);
        } else {
          setError('Job 상세 정보를 불러오는데 실패했습니다.');
        }
      } catch {
        setError('Job 상세 정보 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [owner, repo],
  );

  // * 워크플로우 실행 로그 조회
  const fetchLogs = useCallback(
    async (runId: string) => {
      if (!owner || !repo) return;

      setLoading(true);
      setError(null);

      try {
        const result = await workflowUtils.getWorkflowRunLogs(owner, repo, runId);
        if (result.success && result.data) {
          setLogs(result.data);
        } else {
          setError('로그를 불러오는데 실패했습니다.');
        }
      } catch {
        setError('로그 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [owner, repo],
  );

  // * 워크플로우 실행 선택
  const handleRunSelect = async (run: WorkflowRun) => {
    setSelectedRun(run);
    await Promise.all([fetchJobDetails(run.id), fetchLogs(run.id)]);
  };

  // * 자동 새로고침 토글
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // * 자동 새로고침 효과
  useEffect(() => {
    if (autoRefresh && owner && repo) {
      intervalRef.current = setInterval(fetchWorkflowRuns, 10000); // 10초마다
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, owner, repo, fetchWorkflowRuns]);

  // * 초기 데이터 로드
  useEffect(() => {
    if (owner && repo) {
      fetchWorkflowRuns();
    }
  }, [owner, repo, fetchWorkflowRuns]);

  if (!owner || !repo) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>GitHub 레포지토리 설정이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">워크플로우 실행 모니터링</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflowRuns}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? '자동 새로고침 중' : '자동 새로고침'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 워크플로우 실행 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>실행 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <LoadingSpinner message="실행 목록을 불러오는 중..." />}

            {error && <ErrorMessage message={error} onRetry={fetchWorkflowRuns} />}

            {!loading && !error && workflowRuns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>실행된 워크플로우가 없습니다.</p>
              </div>
            )}

            {!loading && !error && workflowRuns.length > 0 && (
              <div className="space-y-2">
                {workflowRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRun?.id === run.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRunSelect(run)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{run.name}</h4>
                        <p className="text-sm text-gray-500">
                          #{run.run_number} • {new Date(run.created_at).toLocaleString()}
                        </p>
                      </div>
                      <WorkflowStatusBadge status={run.conclusion || run.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 선택된 실행 상세 정보 */}
        {selectedRun && (
          <Card>
            <CardHeader>
              <CardTitle>실행 상세 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedRun.name}</h3>
                  <p className="text-sm text-gray-500">
                    #{selectedRun.run_number} •{' '}
                    {new Date(selectedRun.created_at).toLocaleString()}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Jobs</h4>
                  {jobDetails.length === 0 ? (
                    <p className="text-sm text-gray-500">Job 정보가 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {jobDetails.map((job) => (
                        <div key={job.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{job.name}</span>
                            <JobStatusBadge
                              status={job.conclusion || job.status}
                              size="sm"
                            />
                          </div>
                          {job.steps.length > 0 && (
                            <div className="space-y-1">
                              {job.steps.map((step, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-600">{step.name}</span>
                                  <JobStatusBadge
                                    status={step.conclusion || step.status}
                                    size="sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">로그</h4>
                  {logs ? (
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">{logs}</pre>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">로그가 없습니다.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
