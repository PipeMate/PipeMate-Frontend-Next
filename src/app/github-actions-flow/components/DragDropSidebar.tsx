//* 드래그 앤 드롭 사이드바 컴포넌트
//* 블록 라이브러리 역할 - 사용자가 워크스페이스에 추가할 수 있는 블록들을 제공
"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { ServerBlock } from "../types";
import { Lightbulb, Filter } from "lucide-react";
import React from "react";
import { getDomainColor, getNodeIcon } from "../constants/nodeConstants";
import { fetchPresetBlocks, PresetBlock } from "../constants/mockData";
import { NODE_COLORS } from "../constants/nodeConstants";

//* 탭 타입 정의 - 트리거, Job, Step 세 가지 카테고리
type TabType = "trigger" | "job" | "step";

//* 필터 타입 정의
type FilterType = "all" | string;

//* 드래그 앤 드롭 사이드바 컴포넌트 - 블록 라이브러리
export const DragDropSidebar = () => {
  //* 현재 활성화된 탭 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>("trigger");

  //* Step 탭 필터 상태 관리
  const [selectedDomain, setSelectedDomain] = useState<FilterType>("all");
  const [selectedTask, setSelectedTask] = useState<FilterType>("all");

  //* 프리셋 블록 데이터 상태 관리
  const [presetBlocks, setPresetBlocks] = useState<
    Record<string, PresetBlock[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

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

  //* 프리셋 블록 데이터 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    const loadPresetBlocks = async () => {
      try {
        setIsLoading(true);
        const blocks = await fetchPresetBlocks();
        setPresetBlocks(blocks);
      } catch (error) {
        console.error("프리셋 블록 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPresetBlocks();
  }, []);

  //* 탭 변경 시 필터 초기화
  useEffect(() => {
    if (activeTab !== "step") {
      setSelectedDomain("all");
      setSelectedTask("all");
    }
  }, [activeTab]);

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

  //* 탭 정보 - 탭별 라벨과 아이콘 정의
  const tabs: { type: TabType; label: string; icon: React.ReactNode }[] = [
    { type: "trigger", label: "Trigger", icon: getNodeIcon("TRIGGER") },
    { type: "job", label: "Job", icon: getNodeIcon("JOB") },
    { type: "step", label: "Step", icon: getNodeIcon("STEP") },
  ];

  return (
    <div className="w-full border-t border-gray-200 flex flex-col h-full min-w-0 min-h-0 box-border bg-white">
      {/* 헤더 - 블록 라이브러리 제목과 설명 (컴팩트하게) */}
      <div className="p-4 border-b border-gray-200 w-full bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-base font-bold text-gray-800 mb-2 text-center w-full flex items-center justify-center gap-2">
          {getNodeIcon("STEPS")}
          <span className="truncate">블록 라이브러리</span>
        </h3>
        <div className="text-xs text-gray-600 text-center leading-relaxed w-full">
          블록을 드래그하여 워크스페이스에 추가하세요
        </div>
      </div>

      {/* 탭 네비게이션 - 트리거, Job, Step 탭 (컴팩트하게) */}
      <div className="flex border-b border-gray-200 w-full bg-gray-50">
        {tabs.map((tab) => (
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
                onChange={(e) => setSelectedTask(e.target.value as FilterType)}
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
          {isLoading ? (
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
    </div>
  );
};
