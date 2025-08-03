"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLayout } from "@/components/layout/LayoutContext";
import { blockAPI } from "@/api/githubClient";
import { BlockResponse } from "@/api/types";
import {
  Settings,
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  Workflow,
  GitBranch,
  Code,
  Database,
  Server,
  Globe,
} from "lucide-react";
import { ROUTES } from "@/config/appConstants";

export default function PresetsPage() {
  const { setHeaderExtra } = useLayout();
  const [blocks, setBlocks] = useState<BlockResponse[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<BlockResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // 헤더 설정
  useEffect(() => {
    setHeaderExtra(
      <div className="flex flex-col gap-0 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 m-0 flex items-center gap-2">
          <Settings size={20} />
          {ROUTES.PRESETS.label}
        </h1>
        <p className="text-sm text-gray-500 m-0">
          GitHub Actions 워크플로우 프리셋 관리
        </p>
      </div>
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    filterBlocks();
  }, [blocks, searchTerm, activeTab]);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const response = await blockAPI.getAll();
      const blocksData = response.data || [];
      setBlocks(blocksData);
    } catch (error) {
      console.error("블록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBlocks = () => {
    let filtered = blocks;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        (block) =>
          block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          block.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          block.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 탭별 필터링
    switch (activeTab) {
      case "trigger":
        filtered = filtered.filter((block) => block.type === "trigger");
        break;
      case "job":
        filtered = filtered.filter((block) => block.type === "job");
        break;
      case "step":
        filtered = filtered.filter((block) => block.type === "step");
        break;
      default:
        break;
    }

    setFilteredBlocks(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trigger":
        return <GitBranch className="w-4 h-4 text-blue-600" />;
      case "job":
        return <Workflow className="w-4 h-4 text-green-600" />;
      case "step":
        return <Code className="w-4 h-4 text-purple-600" />;
      case "database":
        return <Database className="w-4 h-4 text-orange-600" />;
      case "server":
        return <Server className="w-4 h-4 text-red-600" />;
      case "api":
        return <Globe className="w-4 h-4 text-indigo-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      trigger: "트리거",
      job: "잡",
      step: "스텝",
      database: "데이터베이스",
      server: "서버",
      api: "API",
    };

    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "job":
        return "bg-green-50 text-green-700 border-green-200";
      case "step":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "database":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "server":
        return "bg-red-50 text-red-700 border-red-200";
      case "api":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">프리셋 관리</h2>
              <p className="text-gray-600 mt-1">
                자주 사용하는 GitHub Actions 워크플로우 템플릿을 관리하세요
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm">
                <Settings className="w-4 h-4 mr-1" />
                {blocks.length} 프리셋
              </Badge>
              <Button>
                <Plus className="w-4 h-4 mr-2" />새 프리셋
              </Button>
            </div>
          </div>
        </div>

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
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-auto"
                >
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
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
                        ? "검색 결과가 없습니다."
                        : "아직 프리셋이 생성되지 않았습니다."}
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
                          <h3 className="font-semibold text-gray-900">
                            {block.name}
                          </h3>
                        </div>
                        {getTypeBadge(block.type)}
                      </div>
                      {block.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {block.description}
                        </p>
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
                            {new Date(block.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            복사
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            편집
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
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
                  <p className="text-2xl font-bold text-blue-600">
                    {blocks.length}
                  </p>
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
                    {blocks.filter((b) => b.type === "trigger").length}
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
                    {blocks.filter((b) => b.type === "job").length}
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
                    {blocks.filter((b) => b.type === "step").length}
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
