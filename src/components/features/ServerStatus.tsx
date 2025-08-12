"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ServerStatus() {
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServerStatus = async () => {
    setServerStatus("checking");
    setLastChecked(new Date());

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const response = await fetch(
        `${baseUrl}/api/github/workflows?owner=test&repo=test`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // * 3초 타임아웃 설정
          signal: AbortSignal.timeout(3000),
        }
      );

      if (response.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch (error) {
      console.log("서버 연결 실패:", error);
      setServerStatus("offline");
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  const getStatusColor = () => {
    switch (serverStatus) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-red-100 text-red-800";
      case "checking":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = () => {
    switch (serverStatus) {
      case "online":
        return "온라인";
      case "offline":
        return "오프라인";
      case "checking":
        return "확인 중...";
      default:
        return "알 수 없음";
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          백엔드 서버 상태
          <Button
            size="sm"
            variant="outline"
            onClick={checkServerStatus}
            disabled={serverStatus === "checking"}
          >
            새로고침
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">상태:</span>
            <Badge className={getStatusColor()}>{getStatusText()}</Badge>
          </div>

          {lastChecked && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">마지막 확인:</span>
              <span className="text-sm text-gray-600">
                {lastChecked.toLocaleTimeString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API URL:</span>
            <span className="text-sm text-gray-600">
              {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}
            </span>
          </div>

          {serverStatus === "offline" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>백엔드 서버가 오프라인입니다.</strong>
                <br />
                Mock 데이터를 사용하여 프론트엔드 기능을 테스트할 수 있습니다.
                <br />
                <br />
                <strong>해결 방법:</strong>
                <br />
                1. 백엔드 서버가 실행 중인지 확인
                <br />
                2. 포트 8080이 사용 가능한지 확인
                <br />
                3. 방화벽 설정 확인
                <br />
                4. API URL 설정 확인
              </p>
            </div>
          )}

          {serverStatus === "online" && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>백엔드 서버가 정상 작동 중입니다.</strong>
                <br />
                실제 API를 사용하여 데이터를 가져옵니다.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
