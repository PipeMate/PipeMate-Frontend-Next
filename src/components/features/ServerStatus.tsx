'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ErrorMessage, IconBadge, LoadingSpinner } from '@/components/ui';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  XCircle,
} from 'lucide-react';

interface ServerInfo {
  name: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  lastCheck: string;
  responseTime: number;
  version: string;
  environment: string;
}

export default function ServerStatus() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // * 서버 상태 조회
  const fetchServerStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      // * 실제로는 API 호출
      // * const response = await fetch('/api/server-status');
      // * const data = await response.json();

      // * 목 데이터
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockData: ServerInfo[] = [
        {
          name: 'API Server',
          status: 'online',
          uptime: '15일 3시간 42분',
          lastCheck: new Date().toISOString(),
          responseTime: 45,
          version: '1.2.3',
          environment: 'production',
        },
        {
          name: 'Database Server',
          status: 'online',
          uptime: '8일 12시간 15분',
          lastCheck: new Date().toISOString(),
          responseTime: 12,
          version: '5.7.32',
          environment: 'production',
        },
        {
          name: 'Cache Server',
          status: 'warning',
          uptime: '2일 5시간 30분',
          lastCheck: new Date().toISOString(),
          responseTime: 150,
          version: '6.2.0',
          environment: 'production',
        },
        {
          name: 'File Storage',
          status: 'offline',
          uptime: '0일 0시간 0분',
          lastCheck: new Date().toISOString(),
          responseTime: 0,
          version: '2.1.0',
          environment: 'production',
        },
      ];

      setServers(mockData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('서버 상태를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // * 초기 로드
  useEffect(() => {
    fetchServerStatus();
  }, []);

  // * 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // * 상태별 아이콘과 색상
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: '온라인',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          label: '경고',
        };
      case 'offline':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: '오프라인',
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: '알 수 없음',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">서버 상태 모니터링</h2>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <p className="text-sm text-gray-600">
              마지막 업데이트: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServerStatus}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>
      </div>

      {/* 서버 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full">
            <LoadingSpinner message="서버 상태를 확인하는 중..." />
          </div>
        )}

        {error && (
          <div className="col-span-full">
            <ErrorMessage message={error} onRetry={fetchServerStatus} />
          </div>
        )}

        {!loading &&
          !error &&
          servers.map((server) => {
            const statusConfig = getStatusConfig(server.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={server.name}
                className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      {server.name}
                    </CardTitle>
                    <IconBadge
                      icon={<StatusIcon className="w-4 h-4" />}
                      variant="outline"
                      size="sm"
                      className={statusConfig.color}
                    >
                      {statusConfig.label}
                    </IconBadge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">응답 시간:</span>
                      <p className="text-gray-600">
                        {server.responseTime > 0 ? `${server.responseTime}ms` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">버전:</span>
                      <p className="text-gray-600">{server.version}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">가동 시간:</span>
                      <span className="text-gray-600">{server.uptime}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">환경:</span>
                      <Badge variant="outline" className="text-xs">
                        {server.environment}
                      </Badge>
                    </div>
                  </div>

                  {server.status === 'offline' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        서버에 연결할 수 없습니다. 관리자에게 문의하세요.
                      </p>
                    </div>
                  )}

                  {server.status === 'warning' && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        응답 시간이 느립니다. 모니터링이 필요합니다.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* 요약 정보 */}
      {!loading && !error && servers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>서버 상태 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {servers.filter((s) => s.status === 'online').length}
                </div>
                <p className="text-sm text-gray-600">온라인</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {servers.filter((s) => s.status === 'warning').length}
                </div>
                <p className="text-sm text-gray-600">경고</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {servers.filter((s) => s.status === 'offline').length}
                </div>
                <p className="text-sm text-gray-600">오프라인</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
