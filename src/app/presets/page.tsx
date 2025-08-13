'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLayout } from '@/components/layout/LayoutContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useBlocks } from '@/api/hooks';
import { BlockResponse } from '@/api/types';
import {
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  GitBranch,
  Workflow,
  Code,
  Database,
  Server,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { ROUTES } from '@/config/appConstants';

export default function PresetsPage() {
  const { setHeaderExtra, setHeaderRight } = useLayout();
  const { owner: _owner, repo: _repo, isConfigured: _isConfigured } = useRepository();
  const PresetsIcon = ROUTES.PRESETS.icon;
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  // 훅 사용
  const {
    data: blocksData,
    isLoading: blocksLoading,
    refetch: refetchBlocks,
  } = useBlocks();
  const blocks = blocksData?.data || [];

  // 헤더 설정(좌측 타이틀, 우측 컨트롤 분리)
  useEffect(() => {
    setHeaderExtra(
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex items-center justify-center rounded-md bg-violet-100 text-violet-700 p-2">
          <PresetsIcon size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-base md:text-lg font-semibold text-slate-900 leading-tight">
            {ROUTES.PRESETS.label}
          </div>
          <div className="text-xs md:text-sm text-slate-500 truncate">
            GitHub Actions 워크플로우 프리셋 관리
          </div>
        </div>
      </div>,
    );
    setHeaderRight(
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" className="text-xs py-1 px-2">
          <Settings className="w-4 h-4 mr-2" /> {blocks.length} 프리셋
        </Badge>
        <Button
          onClick={() => refetchBlocks()}
          disabled={blocksLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${blocksLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />새 프리셋
        </Button>
      </div>,
    );
    return () => {
      setHeaderExtra(null);
      setHeaderRight(null);
    };
  }, [setHeaderExtra, setHeaderRight, blocks.length, blocksLoading, refetchBlocks]);

  // 프리셋 필터링
  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch =
      searchTerm === '' ||
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.type.toLowerCase().includes(searchTerm.toLowerCase());

    // activeTab 상태가 제거되었으므로, 모든 타입을 포함하도록 변경
    const matchesTab = true;

    return matchesSearch && matchesTab;
  });

  const handleCopyBlock = async (block: BlockResponse) => {
    try {
      const blockData = {
        name: block.name,
        description: block.description,
        type: block.type,
        // 백엔드 표준인 config 필드 우선 사용, 없으면 content로 폴백
        config: block.config ?? block.content,
        jobName: block.jobName,
        domain: block.domain,
        task: block.task,
      };

      await navigator.clipboard.writeText(JSON.stringify(blockData, null, 2));
      setCopiedBlock(block.id.toString());

      setTimeout(() => {
        setCopiedBlock(null);
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handleEditBlock = (block: BlockResponse) => {
    // 편집 기능은 별도 모달이나 페이지로 이동
    console.log('편집할 블록:', block);
  };

  const handleDeleteBlock = (block: BlockResponse) => {
    // 삭제 확인 후 API 호출
    if (confirm(`"${block.name}" 프리셋을 삭제하시겠습니까?`)) {
      console.log('삭제할 블록:', block);
      // TODO: 삭제 API 호출
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <GitBranch className="w-4 h-4 text-blue-600" />;
      case 'job':
        return <Workflow className="w-4 h-4 text-green-600" />;
      case 'step':
        return <Code className="w-4 h-4 text-purple-600" />;
      case 'database':
        return <Database className="w-4 h-4 text-orange-600" />;
      case 'server':
        return <Server className="w-4 h-4 text-red-600" />;
      case 'api':
        return <Globe className="w-4 h-4 text-indigo-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      trigger: '트리거',
      job: '잡',
      step: '스텝',
      database: '데이터베이스',
      server: '서버',
      api: 'API',
    };

    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'job':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'step':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'database':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'server':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'api':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* 상단 타이틀/컨트롤은 레이아웃 헤더로 통합됨 */}

        {/* 검색 및 필터 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="프리셋 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">전체</TabsTrigger>
                    <TabsTrigger value="trigger">트리거</TabsTrigger>
                    <TabsTrigger value="job">잡</TabsTrigger>
                    <TabsTrigger value="step">스텝</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 프리셋 목록 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsContent value="all" className="space-y-4">
            {blocksLoading ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">프리셋을 불러오는 중...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredBlocks.length === 0 ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      프리셋이 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm
                        ? '검색 결과가 없습니다.'
                        : '아직 프리셋이 생성되지 않았습니다.'}
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />첫 프리셋 생성
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlocks.map((block) => (
                  <Card
                    key={block.id}
                    className="hover:shadow-lg transition-all duration-200 group"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(block.type)}
                          <h3 className="font-semibold text-gray-900">{block.name}</h3>
                        </div>
                        {getTypeBadge(block.type)}
                      </div>
                      {block.description && (
                        <p className="text-sm text-gray-600 mt-2">{block.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>타입</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTypeColor(block.type)}`}
                          >
                            {block.type}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>생성일</span>
                          <span>
                            {block.createdAt
                              ? new Date(block.createdAt).toLocaleDateString()
                              : '-'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleCopyBlock(block)}
                            disabled={copiedBlock === block.id.toString()}
                          >
                            {copiedBlock === block.id.toString() ? (
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            {copiedBlock === block.id.toString() ? '복사됨' : '복사'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEditBlock(block)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            편집
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDeleteBlock(block)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 프리셋</p>
                  <p className="text-2xl font-bold text-blue-600">{blocks.length}</p>
                </div>
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">트리거</p>
                  <p className="text-2xl font-bold text-green-600">
                    {blocks.filter((b) => b.type === 'trigger').length}
                  </p>
                </div>
                <GitBranch className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">잡</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {blocks.filter((b) => b.type === 'job').length}
                  </p>
                </div>
                <Workflow className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">스텝</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {blocks.filter((b) => b.type === 'step').length}
                  </p>
                </div>
                <Code className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
