"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { workflowUtils } from "@/lib/githubActions";

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

import { useRepository } from "@/contexts/RepositoryContext";

export default function LogMonitor() {
  const { owner, repo } = useRepository();
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [logs, setLogs] = useState<string>("");
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
        setError("워크플로우 실행 목록을 불러오는데 실패했습니다.");
      }
    } catch {
      setError("워크플로우 실행 목록 조회 중 오류가 발생했습니다.");
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
        const result = await workflowUtils.getWorkflowRunJobs(
          owner,
          repo,
          runId
        );
        if (result.success && result.data) {
          setJobDetails(result.data);
        } else {
          setError("Job 상세 정보를 불러오는데 실패했습니다.");
        }
      } catch {
        setError("Job 상세 정보 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [owner, repo]
  );

  // * 워크플로우 실행 로그 조회
  const fetchLogs = useCallback(
    async (runId: string) => {
      if (!owner || !repo) return;

      setLoading(true);
      setError(null);

      try {
        const result = await workflowUtils.getWorkflowRunLogs(
          owner,
          repo,
          runId
        );
        if (result.success && result.data) {
          setLogs(result.data);
        } else {
          setError("로그를 불러오는데 실패했습니다.");
        }
      } catch {
        setError("로그 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [owner, repo]
  );

  // * 실행 선택
  const handleRunSelect = async (run: WorkflowRun) => {
    setSelectedRun(run);
    await fetchJobDetails(run.id);
    await fetchLogs(run.id);
  };

  // * 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        if (selectedRun) {
          fetchJobDetails(selectedRun.id);
          if (selectedRun.status === "in_progress") {
            fetchLogs(selectedRun.id);
          }
        }
      }, 5000); // 5초마다 새로고침
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, selectedRun, fetchJobDetails, fetchLogs]);

  useEffect(() => {
    fetchWorkflowRuns();
  }, [fetchWorkflowRuns]);

  // * 로그 키워드 하이라이트
  const highlightLogs = (logText: string) => {
    return logText
      .split("\n")
      .map((line) => {
        let highlightedLine = line;

        // * 에러 키워드 (빨간색)
        if (
          line.toLowerCase().includes("error") ||
          line.toLowerCase().includes("failed")
        ) {
          highlightedLine = `<span class="text-red-600 font-semibold">${line}</span>`;
        }
        // * 성공 키워드 (초록색)
        else if (
          line.toLowerCase().includes("success") ||
          line.toLowerCase().includes("passed")
        ) {
          highlightedLine = `<span class="text-green-600 font-semibold">${line}</span>`;
        }
        // * 경고 키워드 (노란색)
        else if (
          line.toLowerCase().includes("warning") ||
          line.toLowerCase().includes("warn")
        ) {
          highlightedLine = `<span class="text-yellow-600 font-semibold">${line}</span>`;
        }
        // * 정보 키워드 (파란색)
        else if (
          line.toLowerCase().includes("info") ||
          line.toLowerCase().includes("step")
        ) {
          highlightedLine = `<span class="text-blue-600">${line}</span>`;
        }

        return highlightedLine;
      })
      .join("\n");
  };

  // * 상태별 색상
  const getStatusColor = (status: string, conclusion?: string) => {
    if (status === "completed") {
      return conclusion === "success"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
    } else if (status === "in_progress") {
      return "bg-blue-100 text-blue-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">로그 모니터링</h2>
        <div className="flex gap-2">
          <Button onClick={fetchWorkflowRuns} disabled={loading}>
            {loading ? "로딩 중..." : "새로고침"}
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "자동 새로고침 중지" : "자동 새로고침 시작"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 워크플로우 실행 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>실행 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workflowRuns.map((run) => (
                <div
                  key={run.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRun?.id === run.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleRunSelect(run)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{run.name}</h4>
                      <p className="text-sm text-gray-600">#{run.run_number}</p>
                    </div>
                    <Badge
                      className={getStatusColor(run.status, run.conclusion)}
                    >
                      {run.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(run.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job 및 Step 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>Job & Step 상태</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRun ? (
              <div className="space-y-4">
                {jobDetails.map((job) => (
                  <div key={job.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{job.name}</h4>
                      <Badge
                        className={getStatusColor(job.status, job.conclusion)}
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {job.steps.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              step.status === "completed"
                                ? step.conclusion === "success"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                : step.status === "in_progress"
                                ? "bg-blue-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <span className="flex-1">{step.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                실행을 선택하세요
              </div>
            )}
          </CardContent>
        </Card>

        {/* 로그 뷰어 */}
        <Card>
          <CardHeader>
            <CardTitle>실행 로그</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRun && logs ? (
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-96 overflow-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightLogs(logs),
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {selectedRun ? "로그를 불러오는 중..." : "실행을 선택하세요"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
