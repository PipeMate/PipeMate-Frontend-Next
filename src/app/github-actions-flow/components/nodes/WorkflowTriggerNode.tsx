//* 인터랙티브 워크플로우 트리거 노드 컴포넌트
//* GitHub Actions 워크플로우 트리거 조건을 관리하는 노드 - push, pull_request, schedule 등
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { useNodeUpdate } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";
import { Plus, X, Check } from "lucide-react";
import { NodeContext } from "./BaseNode";
import { NodeTypeBadge } from "./NodeTypeBadge";
import {
  NODE_COLORS,
  NODE_HANDLE_CONFIGS,
  getNodeIcon,
  NODE_TITLES,
} from "../../constants/nodeConstants";

//* 워크플로우 트리거 노드 컴포넌트 - GitHub Actions 트리거 설정 관리
export const WorkflowTriggerNode = memo(({ data, id }: NodeProps) => {
  //* 노드 데이터 업데이트 훅 - ReactFlowWorkspace에서 제공
  const updateNodeData = useNodeUpdate();

  //* 새로운 설정 추가 UI 상태 관리
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* 편집 모드 상태 (외부에서 전달받음)
  const isEditing = (data.isEditing as boolean) || false;

  //* 워크플로우 이름 변경 핸들러 - 워크플로우의 표시 이름
  const onWorkflowNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      updateNodeData(id, {
        label: newName,
        config: {
          ...(data.config as Record<string, unknown>),
          name: newName,
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 브랜치 변경 핸들러 - 트리거될 브랜치 설정
  const onBranchChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newBranch = evt.target.value;
      const config = data.config as Record<string, unknown>;
      const onConfig = config.on as Record<string, unknown> | undefined;
      const pushConfig = onConfig?.push as Record<string, unknown> | undefined;

      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          on: {
            ...onConfig,
            push: {
              ...pushConfig,
              branches: [newBranch],
            },
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 트리거 타입 토글 핸들러 - push, pull_request, schedule 등 활성화/비활성화
  const onTriggerToggle = useCallback(
    (triggerType: string) => {
      const config = data.config as Record<string, unknown>;
      const currentOn = (config.on as Record<string, unknown>) || {};
      const newOn = { ...currentOn };

      if (newOn[triggerType]) {
        //* 이미 활성화된 트리거 타입이면 비활성화
        delete newOn[triggerType];
      } else {
        //* 새로운 트리거 타입 활성화
        if (triggerType === "push") {
          newOn[triggerType] = { branches: ["main"] };
        } else if (triggerType === "pull_request") {
          newOn[triggerType] = { branches: ["main"] };
        } else if (triggerType === "schedule") {
          newOn[triggerType] = [{ cron: "0 0 * * *" }];
        } else {
          newOn[triggerType] = {};
        }
      }

      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          on: newOn,
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 새로운 설정 추가 핸들러 - 동적으로 워크플로우 설정 추가
  const onAddConfig = useCallback(() => {
    if (newConfigKey && newConfigValue) {
      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          [newConfigKey]: newConfigValue,
        },
      });
      setNewConfigKey("");
      setNewConfigValue("");
      setShowAddConfig(false);
    }
  }, [id, data.config, newConfigKey, newConfigValue, updateNodeData]);

  //* 설정 삭제 핸들러 - 동적으로 추가된 설정 제거
  const onRemoveConfig = useCallback(
    (key: string) => {
      const config = (data.config as Record<string, unknown>) || {};
      const newConfig = { ...config };
      delete newConfig[key];
      updateNodeData(id, {
        config: newConfig,
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 현재 설정 데이터 추출
  const config = data.config as Record<string, unknown>;
  const currentOn = (config.on as Record<string, unknown>) || {};
  const activeTriggers = Object.keys(currentOn);

  //* 핸들 설정 - 트리거 노드의 연결점 정의
  const handles = NODE_HANDLE_CONFIGS.TRIGGER.map((handle) => ({
    ...handle,
    position: handle.position as Position,
  }));

  //* Trigger 노드 전용 색상 - 초록색 계열로 구분 (워크플로우와 동일)
  const colors = NODE_COLORS.TRIGGER;

  return (
    <NodeContext.Provider value={{}}>
      <BaseNode
        icon={getNodeIcon("TRIGGER")}
        title={(config.name as string) || "워크플로우 트리거"}
        description={
          (data.description as string) ||
          "GitHub Actions 워크플로우 트리거 설정"
        }
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
        nodeTypeBadge={<NodeTypeBadge type="TRIGGER" />} //* 노드 타입 뱃지
      >
        {!isEditing ? (
          //* 읽기 모드: 트리거 정보 표시 - 간단한 요약 정보
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-700">
              Triggers on{" "}
              <span className="font-bold text-emerald-600 bg-emerald-100 rounded px-1">
                {activeTriggers.length > 0
                  ? activeTriggers.join(", ")
                  : "manual"}
              </span>
              {Boolean(currentOn.push || currentOn.pull_request) && (
                <>
                  {" for branch "}
                  <span className="font-bold text-emerald-600 bg-emerald-100 rounded px-1">
                    {(
                      (currentOn.push as Record<string, unknown>)
                        ?.branches as string[]
                    )?.[0] ||
                      (
                        (currentOn.pull_request as Record<string, unknown>)
                          ?.branches as string[]
                      )?.[0] ||
                      "main"}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          //* 편집 모드: 트리거 설정 편집 UI - 상세 설정 가능
          <div className="flex flex-col gap-3">
            {/* 워크플로우 이름 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`workflow-name-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                워크플로우 이름:
              </label>
              <input
                id={`workflow-name-${id}`}
                type="text"
                value={(config.name as string) || "My Workflow"}
                onChange={onWorkflowNameChange}
                className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder="My Workflow"
              />
            </div>

            {/* 트리거 타입 설정 - 토글 버튼들 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                트리거 타입:
              </label>
              <div className="flex flex-wrap gap-2">
                {["push", "pull_request", "schedule", "workflow_dispatch"].map(
                  (trigger) => (
                    <button
                      key={trigger}
                      onClick={() => onTriggerToggle(trigger)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 ${
                        currentOn[trigger]
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {trigger}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* 브랜치 설정 (push 또는 pull_request가 활성화된 경우) */}
            {Boolean(currentOn.push || currentOn.pull_request) && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`branch-${id}`}
                  className="text-xs font-medium text-gray-600"
                >
                  브랜치:
                </label>
                <input
                  id={`branch-${id}`}
                  type="text"
                  value={
                    (
                      (currentOn.push as Record<string, unknown>)
                        ?.branches as string[]
                    )?.[0] ||
                    (
                      (currentOn.pull_request as Record<string, unknown>)
                        ?.branches as string[]
                    )?.[0] ||
                    "main"
                  }
                  onChange={onBranchChange}
                  className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  placeholder="main"
                />
              </div>
            )}

            {/* 추가 설정들 - 동적으로 추가된 설정들 표시 */}
            {
              Object.entries(config || {}).map(
                ([key, value]) =>
                  key !== "name" &&
                  key !== "on" && (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                        <span className="text-xs font-medium text-gray-500 min-w-[60px]">
                          {key}:
                        </span>
                        <span className="text-xs text-gray-700 flex-1 break-all">
                          {String(value)}
                        </span>
                        <button
                          onClick={() => onRemoveConfig(key)}
                          className="bg-red-500 text-white rounded w-4 h-4 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                          title="삭제"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
              ) as React.ReactNode
            }

            {/* 새로운 설정 추가 UI */}
            {showAddConfig ? (
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={newConfigKey}
                    onChange={(e) => setNewConfigKey(e.target.value)}
                    placeholder="키"
                    className="nodrag px-2 py-1 border rounded text-xs"
                  />
                  <input
                    type="text"
                    value={newConfigValue}
                    onChange={(e) => setNewConfigValue(e.target.value)}
                    placeholder="값"
                    className="nodrag px-2 py-1 border rounded text-xs"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={onAddConfig}
                      className="bg-emerald-500 text-white rounded px-2 py-1 text-xs hover:bg-emerald-600 flex items-center gap-1"
                    >
                      <Check size={14} /> 추가
                    </button>
                    <button
                      onClick={() => setShowAddConfig(false)}
                      className="bg-gray-500 text-white rounded px-2 py-1 text-xs hover:bg-gray-600 flex items-center gap-1"
                    >
                      <X size={14} /> 취소
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddConfig(true)}
                className="w-full bg-emerald-500 text-white rounded px-2 py-1 text-xs hover:bg-emerald-600 flex items-center justify-center gap-1"
              >
                <Plus size={16} /> 설정 추가
              </button>
            )}
          </div>
        )}
      </BaseNode>
    </NodeContext.Provider>
  );
});

WorkflowTriggerNode.displayName = "WorkflowTriggerNode";
