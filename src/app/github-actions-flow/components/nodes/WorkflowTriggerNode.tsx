//* 인터랙티브 워크플로우 트리거 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";
import { RefreshCcw, Plus, X, Check } from "lucide-react";
import { NodeContext } from "./BaseNode";

export const WorkflowTriggerNode = memo(({ data, id }: NodeProps) => {
  const updateNodeData = useNodeUpdate();
  const deleteNode = useNodeDelete();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* 워크플로우 이름 변경 핸들러
  const onWorkflowNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      updateNodeData(id, {
        label: newName,
        config: {
          ...data.config,
          name: newName,
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 브랜치 변경 핸들러
  const onBranchChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newBranch = evt.target.value;
      updateNodeData(id, {
        config: {
          ...data.config,
          on: {
            ...data.config.on,
            push: {
              ...data.config.on?.push,
              branches: [newBranch],
            },
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 트리거 타입 토글 핸들러
  const onTriggerToggle = useCallback(
    (triggerType: string) => {
      const currentOn = data.config.on || {};
      const newOn = { ...currentOn };

      if (newOn[triggerType]) {
        delete newOn[triggerType];
      } else {
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
          ...data.config,
          on: newOn,
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 새로운 설정 추가 핸들러
  const onAddConfig = useCallback(() => {
    if (newConfigKey && newConfigValue) {
      updateNodeData(id, {
        config: {
          ...data.config,
          [newConfigKey]: newConfigValue,
        },
      });
      setNewConfigKey("");
      setNewConfigValue("");
      setShowAddConfig(false);
    }
  }, [id, data.config, newConfigKey, newConfigValue, updateNodeData]);

  //* 설정 삭제 핸들러
  const onRemoveConfig = useCallback(
    (key: string) => {
      const newConfig = { ...data.config };
      delete newConfig[key];
      updateNodeData(id, {
        config: newConfig,
      });
    },
    [id, data.config, updateNodeData]
  );

  const currentOn = data.config.on || {};
  const activeTriggers = Object.keys(currentOn);

  // 핸들 설정
  const handles = [
    {
      type: "source" as const,
      position: Position.Bottom,
      className: "reactflow-handle",
    },
  ];

  // Trigger 노드 전용 색상
  const colors = { bg: "#ecfdf5", border: "#10b981", text: "#065f46" };

  return (
    <NodeContext.Provider
      value={{
        isEditing,
        onEdit: () => {
          if (!isEditing) setIsEditing(true);
        },
        onSave: () => setIsEditing(false),
        onDelete: (e) => {
          e.stopPropagation();
          deleteNode(id);
        },
      }}
    >
      <BaseNode
        icon={<RefreshCcw size={18} />}
        title="워크플로우 트리거"
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
      >
        {!isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-700">
              Workflow{" "}
              <span className="font-bold text-emerald-600 bg-emerald-100 rounded px-1">
                {data.config?.name || "My Workflow"}
              </span>{" "}
              triggers on{" "}
              <span className="font-bold text-emerald-600 bg-emerald-100 rounded px-1">
                {activeTriggers.length > 0
                  ? activeTriggers.join(", ")
                  : "manual"}
              </span>
              {(currentOn.push || currentOn.pull_request) && (
                <>
                  {" for branch "}
                  <span className="font-bold text-emerald-600 bg-emerald-100 rounded px-1">
                    {currentOn.push?.branches?.[0] ||
                      currentOn.pull_request?.branches?.[0] ||
                      "main"}
                  </span>
                </>
              )}
              .
            </div>
          </div>
        ) : (
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
                value={data.config?.name || "My Workflow"}
                onChange={onWorkflowNameChange}
                className="nodrag px-2 py-1 border rounded text-xs"
                placeholder="My Workflow"
              />
            </div>
            {/* 트리거 타입 설정 */}
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
                      className={`px-2 py-1 text-xs rounded border ${
                        currentOn[trigger]
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-emerald-700 border-emerald-300"
                      }`}
                    >
                      {trigger}
                    </button>
                  )
                )}
              </div>
            </div>
            {/* 브랜치 설정 (push 또는 pull_request가 활성화된 경우) */}
            {(currentOn.push || currentOn.pull_request) && (
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
                    currentOn.push?.branches?.[0] ||
                    currentOn.pull_request?.branches?.[0] ||
                    "main"
                  }
                  onChange={onBranchChange}
                  className="nodrag px-2 py-1 border rounded text-xs"
                  placeholder="main"
                />
              </div>
            )}
            {/* 추가 설정들 */}
            {Object.entries(data.config || {}).map(
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
            )}
            {/* 새로운 설정 추가 */}
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
