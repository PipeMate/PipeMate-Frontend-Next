//* 드래그 앤 드롭 사이드바 컴포넌트
//* 블록 라이브러리와 파이프라인 라이브러리 역할 - 사용자가 워크스페이스에 추가할 수 있는 블록들과 파이프라인들을 제공
"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { ServerBlock, Pipeline } from "../types";
import { Lightbulb, Filter, Blocks, GitBranch } from "lucide-react";
import React from "react";
import { getDomainColor, getNodeIcon } from "../constants/nodeConstants";
import { NODE_COLORS } from "../constants/nodeConstants";

//* 탭 타입 정의 - 트리거, Job, Step 세 가지 카테고리
type TabType = "trigger" | "job" | "step";

//* 파이프라인 탭 타입 정의
type PipelineTabType = "cicd" | "ci" | "cd" | "test" | "deploy";

//* 필터 타입 정의
type FilterType = "all" | string;

//* 라이브러리 모드 타입 정의
type LibraryMode = "blocks" | "pipelines";

//* 프리셋 블록 데이터 타입
interface PresetBlock extends ServerBlock {
  id: string;
}

//* 프리셋 파이프라인 데이터 타입
interface PresetPipeline extends Pipeline {
  id: string;
}

//* 드래그 앤 드롭 사이드바 컴포넌트 - 블록 라이브러리와 파이프라인 라이브러리
export const DragDropSidebar = () => {
  //* 라이브러리 모드 상태 관리 (블록 또는 파이프라인)
  const [libraryMode, setLibraryMode] = useState<LibraryMode>("blocks");

  //* 현재 활성화된 탭 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>("trigger");
  const [activePipelineTab, setActivePipelineTab] =
    useState<PipelineTabType>("cicd");

  //* Step 탭 필터 상태 관리
  const [selectedDomain, setSelectedDomain] = useState<FilterType>("all");
  const [selectedTask, setSelectedTask] = useState<FilterType>("all");

  //* 프리셋 블록 데이터 상태 관리
  const [presetBlocks, setPresetBlocks] = useState<
    Record<string, PresetBlock[]>
  >({});
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);

  //* 프리셋 파이프라인 데이터 상태 관리
  const [presetPipelines, setPresetPipelines] = useState<
    Record<string, PresetPipeline[]>
  >({});
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(true);

  //* 드래그 시작 핸들러 - 블록을 워크스페이스로 드래그할 때 호출
  const onDragStart = useCallback(
    (event: React.DragEvent, block: ServerBlock) => {
      //* 드래그 데이터 설정 - React Flow가 인식할 수 있는 형식
      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify(block)
      );
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  //* 파이프라인 드래그 시작 핸들러 - 파이프라인을 워크스페이스로 드래그할 때 호출
  const onPipelineDragStart = useCallback(
    (event: React.DragEvent, pipeline: Pipeline) => {
      //* 파이프라인의 모든 블록들을 드래그 데이터로 설정
      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify({
          type: "pipeline",
          pipeline: pipeline,
          blocks: pipeline.blocks,
        })
      );
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  //* 프리셋 블록 데이터 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    const loadPresetBlocks = async () => {
      try {
        setIsLoadingBlocks(true);
        // TODO: 실제 API 호출로 대체
        setPresetBlocks({});
      } catch (error) {
        console.error("프리셋 블록 로드 실패:", error);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    loadPresetBlocks();
  }, []);

  //* 프리셋 파이프라인 데이터 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    const loadPresetPipelines = async () => {
      try {
        setIsLoadingPipelines(true);
        // TODO: 실제 API 호출로 대체
        setPresetPipelines({});
      } catch (error) {
        console.error("프리셋 파이프라인 로드 실패:", error);
      } finally {
        setIsLoadingPipelines(false);
      }
    };

    loadPresetPipelines();
  }, []);

  //* 탭 변경 시 필터 초기화
  useEffect(() => {
    if (activeTab !== "step") {
      setSelectedDomain("all");
      setSelectedTask("all");
    }
  }, [activeTab]);

  //* 라이브러리 모드 변경 시 탭 초기화
  useEffect(() => {
    if (libraryMode === "blocks") {
      setActiveTab("trigger");
    } else {
      setActivePipelineTab("cicd");
    }
  }, [libraryMode]);

  //* 도메인과 태스크를 동적으로 추출하는 함수
  const { domains, tasks } = useMemo(() => {
    if (activeTab !== "step") {
      return { domains: [], tasks: [] };
    }

    const stepBlocks = presetBlocks.step || [];

    //* 모든 도메인 추출 (중복 제거)
    const allDomains = Array.from(
      new Set(stepBlocks.map((block) => block.domain).filter(Boolean))
    ).sort();

    //* 선택된 도메인의 모든 태스크 추출 (중복 제거)
    const allTasks =
      selectedDomain === "all"
        ? Array.from(
            new Set(
              stepBlocks.flatMap((block) => block.task || []).filter(Boolean)
            )
          ).sort()
        : Array.from(
            new Set(
              stepBlocks
                .filter((block) => block.domain === selectedDomain)
                .flatMap((block) => block.task || [])
                .filter(Boolean)
            )
          ).sort();

    return { domains: allDomains, tasks: allTasks };
  }, [activeTab, presetBlocks.step, selectedDomain]);

  //* 필터링된 블록 목록 생성
  const filteredBlocks = useMemo(() => {
    const currentBlocks = presetBlocks[activeTab] || [];

    if (activeTab !== "step") {
      return currentBlocks;
    }

    return currentBlocks.filter((block) => {
      //* 도메인 필터링
      if (selectedDomain !== "all" && block.domain !== selectedDomain) {
        return false;
      }

      //* 태스크 필터링
      if (selectedTask !== "all") {
        const blockTasks = block.task || [];
        if (!blockTasks.includes(selectedTask)) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, presetBlocks, selectedDomain, selectedTask]);

  //* 필터링된 파이프라인 목록 생성
  const filteredPipelines = useMemo(() => {
    const currentPipelines = presetPipelines[activePipelineTab] || [];
    return currentPipelines;
  }, [activePipelineTab, presetPipelines]);

  //* 블록 타입별 아이콘 - 각 블록 타입을 아이콘으로 구분
  const getBlockIcon = (type: string) => {
    switch (type) {
      case "trigger":
        return getNodeIcon("TRIGGER");
      case "job":
        return getNodeIcon("JOB");
      case "step":
        return getNodeIcon("STEP");
      default:
        return getNodeIcon("STEPS");
    }
  };

  //* 파이프라인 타입별 아이콘
  const getPipelineIcon = (type: string) => {
    switch (type) {
      case "cicd":
        return <GitBranch size={16} className="text-purple-500" />;
      case "ci":
        return <GitBranch size={16} className="text-blue-500" />;
      case "cd":
        return <GitBranch size={16} className="text-green-500" />;
      case "test":
        return <GitBranch size={16} className="text-yellow-500" />;
      case "deploy":
        return <GitBranch size={16} className="text-red-500" />;
      default:
        return <GitBranch size={16} className="text-gray-500" />;
    }
  };

  //* 블록 탭 정보 - 탭별 라벨과 아이콘 정의
  const blockTabs: { type: TabType; label: string; icon: React.ReactNode }[] = [
    { type: "trigger", label: "Trigger", icon: getNodeIcon("TRIGGER") },
    { type: "job", label: "Job", icon: getNodeIcon("JOB") },
    { type: "step", label: "Step", icon: getNodeIcon("STEP") },
  ];

  //* 파이프라인 탭 정보 - 탭별 라벨과 아이콘 정의
  const pipelineTabs: {
    type: PipelineTabType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "cicd", label: "CI/CD", icon: getPipelineIcon("cicd") },
    { type: "ci", label: "CI", icon: getPipelineIcon("ci") },
    { type: "cd", label: "CD", icon: getPipelineIcon("cd") },
    { type: "test", label: "Test", icon: getPipelineIcon("test") },
    { type: "deploy", label: "Deploy", icon: getPipelineIcon("deploy") },
  ];

  //* 파이프라인 타입별 색상
  const getPipelineColors = (type: string) => {
    switch (type) {
      case "cicd":
        return {
          bg: "#faf5ff",
          border: "#8b5cf6",
          text: "#581c87",
          hover: "#f3e8ff",
        };
      case "ci":
        return {
          bg: "#eff6ff",
          border: "#3b82f6",
          text: "#1e40af",
          hover: "#dbeafe",
        };
      case "cd":
        return {
          bg: "#f0fdf4",
          border: "#22c55e",
          text: "#15803d",
          hover: "#dcfce7",
        };
      case "test":
        return {
          bg: "#fefce8",
          border: "#eab308",
          text: "#a16207",
          hover: "#fef3c7",
        };
      case "deploy":
        return {
          bg: "#fef2f2",
          border: "#ef4444",
          text: "#b91c1c",
          hover: "#fee2e2",
        };
      default:
        return {
          bg: "#f3f4f6",
          border: "#6b7280",
          text: "#374151",
          hover: "#e5e7eb",
        };
    }
  };

  return (
    <div className="w-full border-t border-gray-200 flex flex-col h-full min-w-0 min-h-0 box-border bg-white">
      {/* 헤더 - 라이브러리 모드 선택 */}
      <div className="p-4 border-b border-gray-200 w-full bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-base font-bold text-gray-800 mb-3 text-center w-full flex items-center justify-center gap-2">
          {libraryMode === "blocks" ? (
            <Blocks size={16} />
          ) : (
            <GitBranch size={16} />
          )}
          <span className="truncate">
            {libraryMode === "blocks"
              ? "블록 라이브러리"
              : "파이프라인 라이브러리"}
          </span>
        </h3>

        {/* 라이브러리 모드 토글 버튼 */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setLibraryMode("blocks")}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1
              ${
                libraryMode === "blocks"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
          >
            <Blocks size={12} />
            블록
          </button>
          <button
            onClick={() => setLibraryMode("pipelines")}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1
              ${
                libraryMode === "pipelines"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
          >
            <GitBranch size={12} />
            파이프라인
          </button>
        </div>

        <div className="text-xs text-gray-600 text-center leading-relaxed w-full mt-2">
          {libraryMode === "blocks"
            ? "블록을 드래그하여 워크스페이스에 추가하세요"
            : "파이프라인을 드래그하여 워크스페이스에 추가하세요"}
        </div>
      </div>

      {/* 블록 라이브러리 모드 */}
      {libraryMode === "blocks" && (
        <>
          {/* 블록 탭 네비게이션 - 트리거, Job, Step 탭 (컴팩트하게) */}
          <div className="flex border-b border-gray-200 w-full bg-gray-50">
            {blockTabs.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`flex-1 px-2 py-3 text-xs font-semibold border-none cursor-pointer transition-all duration-200 flex flex-col items-center gap-1 w-full
                  ${
                    activeTab === tab.type
                      ? tab.type === "trigger"
                        ? "bg-white text-emerald-500 shadow-sm border-b-2 border-emerald-500"
                        : tab.type === "job"
                        ? "bg-white text-blue-500 shadow-sm border-b-2 border-blue-500"
                        : tab.type === "step"
                        ? "bg-white text-amber-500 shadow-sm border-b-2 border-amber-500"
                        : "bg-white text-gray-600 shadow-sm border-b-2 border-gray-600"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }
                `}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="truncate w-full text-center">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Step 탭 필터 - 도메인과 태스크 필터링 */}
          {activeTab === "step" && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Filter size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">필터</span>
              </div>

              {/* 도메인 필터 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 min-w-[40px]">
                    도메인:
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => {
                      setSelectedDomain(e.target.value as FilterType);
                      setSelectedTask("all"); //* 도메인 변경 시 태스크 초기화
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">전체</option>
                    {domains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 태스크 필터 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 min-w-[40px]">
                    태스크:
                  </label>
                  <select
                    value={selectedTask}
                    onChange={(e) =>
                      setSelectedTask(e.target.value as FilterType)
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={selectedDomain === "all" && tasks.length === 0}
                  >
                    <option value="all">전체</option>
                    {tasks.map((task) => (
                      <option key={task} value={task}>
                        {task}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 블록 리스트 - 현재 탭의 블록들 표시 (컴팩트하게) */}
          <div className="flex-1 p-3 overflow-y-auto w-full flex flex-col justify-between bg-gray-50">
            <div className="flex flex-col gap-3 w-full">
              {isLoadingBlocks ? (
                //* 로딩 상태 표시
                <div className="flex items-center justify-center py-6">
                  <div className="text-gray-500 text-xs">
                    프리셋 블록을 불러오는 중...
                  </div>
                </div>
              ) : (
                filteredBlocks.map((block, index) => {
                  //* 블록 타입에 따라 직접 색상 적용
                  const colors = (() => {
                    if (block.type === "trigger") {
                      return NODE_COLORS.TRIGGER;
                    } else if (block.type === "job") {
                      return NODE_COLORS.JOB;
                    } else if (block.type === "step" && block.domain) {
                      return getDomainColor(block.domain);
                    } else {
                      return {
                        bg: "#f3f4f6",
                        border: "#6b7280",
                        text: "#374151",
                        hover: "#e5e7eb",
                      };
                    }
                  })();

                  const icon = getBlockIcon(block.type);

                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => onDragStart(e, block)}
                      style={{
                        backgroundColor: colors.bg,
                        border: `2px solid ${colors.border}`,
                        color: colors.text,
                      }}
                      className="p-3 rounded-lg transition-all duration-200 w-full shadow-sm hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing group"
                      onMouseDown={(e) => {
                        e.currentTarget.style.cursor = "grabbing";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.cursor = "grab";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.cursor = "grab";
                      }}
                    >
                      {/* 블록 헤더 - 아이콘과 제목 (컴팩트하게) */}
                      <div className="flex items-start gap-2 mb-2 w-full">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span
                              style={{ color: colors.text }}
                              className="text-xs font-bold truncate"
                              title={block.name}
                            >
                              {block.name}
                            </span>
                          </div>
                          {/* 도메인/태스크 정보 (컴팩트하게) */}
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/50">
                              <span className="truncate text-xs">
                                {block.type === "step" && block.domain
                                  ? `${block.domain}${
                                      block.task && block.task.length > 0
                                        ? ` • ${block.task.join(", ")}`
                                        : ""
                                    }`
                                  : block.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 블록 설명 (컴팩트하게) */}
                      <div
                        style={{ color: colors.text, opacity: 0.8 }}
                        className="text-xs leading-relaxed w-full mb-2 line-clamp-2"
                        title={block.description}
                      >
                        {block.description}
                      </div>

                      {/* 블록 타입 라벨 (컴팩트하게) */}
                      <div
                        style={{
                          backgroundColor: colors.border,
                          color: "#ffffff",
                        }}
                        className="px-2 py-0.5 text-xs rounded-full font-semibold inline-block w-auto shadow-sm"
                      >
                        {block.type.toUpperCase()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 사용법 안내 - 사용자에게 도움말 제공 (컴팩트하게) */}
            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 leading-relaxed w-full shadow-sm">
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb size={12} className="text-amber-500 flex-shrink-0" />
                <strong className="text-gray-800 text-xs">사용법:</strong>
              </div>
              <ul className="space-y-0.5 text-xs">
                <li>• 블록을 드래그하여 워크스페이스에 드롭</li>
                <li>• Job 블록 아래에 Step 블록을 드롭하면 자동으로 연결</li>
                <li>• 트리거 블록은 최상위에 배치됩니다</li>
                {activeTab === "step" && (
                  <li>• 도메인과 태스크로 Step 블록을 필터링할 수 있습니다</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* 파이프라인 라이브러리 모드 */}
      {libraryMode === "pipelines" && (
        <>
          {/* 파이프라인 탭 네비게이션 */}
          <div className="flex border-b border-gray-200 w-full bg-gray-50">
            {pipelineTabs.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActivePipelineTab(tab.type)}
                className={`flex-1 px-2 py-3 text-xs font-semibold border-none cursor-pointer transition-all duration-200 flex flex-col items-center gap-1 w-full
                  ${
                    activePipelineTab === tab.type
                      ? "bg-white text-purple-600 shadow-sm border-b-2 border-purple-500"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }
                `}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="truncate w-full text-center">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 파이프라인 리스트 */}
          <div className="flex-1 p-3 overflow-y-auto w-full flex flex-col justify-between bg-gray-50">
            <div className="flex flex-col gap-3 w-full">
              {isLoadingPipelines ? (
                //* 로딩 상태 표시
                <div className="flex items-center justify-center py-6">
                  <div className="text-gray-500 text-xs">
                    프리셋 파이프라인을 불러오는 중...
                  </div>
                </div>
              ) : (
                filteredPipelines.map((pipeline, index) => {
                  const colors = getPipelineColors(pipeline.type);
                  const icon = getPipelineIcon(pipeline.type);

                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => onPipelineDragStart(e, pipeline)}
                      style={{
                        backgroundColor: colors.bg,
                        border: `2px solid ${colors.border}`,
                        color: colors.text,
                      }}
                      className="p-3 rounded-lg transition-all duration-200 w-full shadow-sm hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing group"
                      onMouseDown={(e) => {
                        e.currentTarget.style.cursor = "grabbing";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.cursor = "grab";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.cursor = "grab";
                      }}
                    >
                      {/* 파이프라인 헤더 - 아이콘과 제목 */}
                      <div className="flex items-start gap-2 mb-2 w-full">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span
                              style={{ color: colors.text }}
                              className="text-xs font-bold truncate"
                              title={pipeline.name}
                            >
                              {pipeline.name}
                            </span>
                          </div>
                          {/* 도메인/태스크 정보 */}
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/50">
                              <span className="truncate text-xs">
                                {pipeline.domain &&
                                pipeline.task &&
                                pipeline.task.length > 0
                                  ? `${pipeline.domain} • ${pipeline.task.join(
                                      ", "
                                    )}`
                                  : pipeline.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 파이프라인 설명 */}
                      <div
                        style={{ color: colors.text, opacity: 0.8 }}
                        className="text-xs leading-relaxed w-full mb-2 line-clamp-2"
                        title={pipeline.description}
                      >
                        {pipeline.description}
                      </div>

                      {/* 파이프라인 정보 */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          style={{
                            backgroundColor: colors.border,
                            color: "#ffffff",
                          }}
                          className="px-2 py-0.5 text-xs rounded-full font-semibold inline-block shadow-sm"
                        >
                          {pipeline.type.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pipeline.blocks.length}개 블록
                        </div>
                      </div>

                      {/* 포함된 블록 미리보기 */}
                      <div className="text-xs text-gray-600">
                        <div className="font-medium mb-1">포함된 블록:</div>
                        <div className="flex flex-wrap gap-1">
                          {pipeline.blocks
                            .slice(0, 3)
                            .map((block, blockIndex) => (
                              <span
                                key={blockIndex}
                                className="px-1.5 py-0.5 bg-white/50 rounded text-xs"
                              >
                                {block.name}
                              </span>
                            ))}
                          {pipeline.blocks.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-white/50 rounded text-xs">
                              +{pipeline.blocks.length - 3}개 더
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 사용법 안내 */}
            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 leading-relaxed w-full shadow-sm">
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb
                  size={12}
                  className="text-purple-500 flex-shrink-0"
                />
                <strong className="text-gray-800 text-xs">
                  파이프라인 사용법:
                </strong>
              </div>
              <ul className="space-y-0.5 text-xs">
                <li>• 파이프라인을 드래그하여 워크스페이스에 드롭</li>
                <li>• 전체 파이프라인이 자동으로 구성됩니다</li>
                <li>• 파이프라인 타입별로 분류되어 있습니다</li>
                <li>• 필요에 따라 개별 블록을 추가로 수정할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
