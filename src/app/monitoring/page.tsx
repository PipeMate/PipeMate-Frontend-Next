"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LogMonitor from "@/components/features/LogMonitor";
import { useLayout } from "@/components/layout/LayoutContext";
import { Monitor } from "lucide-react";
import { ROUTES } from "@/config/appConstants";
import { useRepository } from "@/contexts/RepositoryContext";

export default function MonitoringPage() {
  const { setHeaderExtra } = useLayout();
  const { owner, repo, isConfigured } = useRepository();

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
      </div>
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {!isConfigured ? (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">로그 모니터링</h2>
          <p className="text-lg text-gray-600">
            GitHub Actions 워크플로우의 실행 로그를 실시간으로 모니터링하세요
          </p>
          <Card className="max-w-md mx-auto p-6">
            <CardContent>
              <p className="text-gray-600 mb-4">
                로그 모니터링을 사용하려면 사이드바에서 GitHub 토큰과
                레포지토리를 설정해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {owner}/{repo}
              </h2>
              <p className="text-gray-600">GitHub 레포지토리</p>
            </div>
          </div>

          <LogMonitor />
        </div>
      )}
    </div>
  );
}
