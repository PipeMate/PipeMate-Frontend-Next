//* 인터랙티브 Step 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";
import { Wrench, Plus, X, Check } from "lucide-react";
import { NodeContext } from "./BaseNode";

export const StepNode = memo(({ data, id }: NodeProps) => {
  const updateNodeData = useNodeUpdate();
  const deleteNode = useNodeDelete();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* Step 이름 변경 핸들러
  const onStepNameChange = useCallback(
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

  //* Step 타입 변경 핸들러
  const onStepTypeChange = useCallback(
    (evt: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = evt.target.value;
      const currentConfig = data.config || {};

      if (newType === "action") {
        updateNodeData(id, {
          config: {
            ...currentConfig,
            uses: currentConfig.uses || "actions/checkout@v4",
            run: undefined,
          },
        });
      } else {
        updateNodeData(id, {
          config: {
            ...currentConfig,
            run: currentConfig.run || "./gradlew build",
            uses: undefined,
          },
        });
      }
    },
    [id, data.config, updateNodeData]
  );

  //* Action/Command 변경 핸들러
  const onActionChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = evt.target.value;
      const currentConfig = data.config || {};

      if (currentConfig.uses) {
        updateNodeData(id, {
          config: {
            ...currentConfig,
            uses: newValue,
          },
        });
      } else {
        updateNodeData(id, {
          config: {
            ...currentConfig,
            run: newValue,
          },
        });
      }
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

  // 핸들 설정
  const handles = [
    {
      type: "target" as const,
      position: Position.Top,
      className: "reactflow-handle",
      style: { top: -4 },
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      className: "reactflow-handle",
      style: { bottom: -4 },
    },
    {
      type: "target" as const,
      position: Position.Left,
      className: "reactflow-handle job-connection",
      style: { left: -4, top: "50%", transform: "translateY(-50%)" },
    },
  ];

  // Step 노드 전용 색상
  const colors = { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };

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
        icon={<Wrench size={18} />}
        title="Step"
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
      >
        {!isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-700">
              Step
              <span className="font-bold text-amber-600 bg-amber-100 rounded px-1">
                {data.config?.name || "Step"}
              </span>
              will execute
              <span className="font-bold text-amber-600 bg-amber-100 rounded px-1">
                {data.config?.uses ? "Action" : "Command"}
              </span>
              :
              <span className="font-bold text-amber-600 bg-amber-100 rounded px-1">
                {data.config?.uses || data.config?.run || ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Step 이름 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`step-name-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                이름:
              </label>
              <input
                id={`step-name-${id}`}
                type="text"
                value={data.config?.name || "Step"}
                onChange={onStepNameChange}
                className="nodrag px-2 py-1 border rounded text-xs"
                placeholder="Step name"
              />
            </div>
            {/* Step 타입 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`step-type-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                타입:
              </label>
              <select
                id={`step-type-${id}`}
                value={data.config?.uses ? "action" : "command"}
                onChange={onStepTypeChange}
                className="nodrag px-2 py-1 border rounded text-xs"
              >
                <option value="action">Action</option>
                <option value="command">Command</option>
              </select>
            </div>
            {/* Action/Command 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`step-action-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                {data.config?.uses ? "Action:" : "Command:"}
              </label>
              <input
                id={`step-action-${id}`}
                type="text"
                value={data.config?.uses || data.config?.run || ""}
                onChange={onActionChange}
                className="nodrag px-2 py-1 border rounded text-xs"
                placeholder={
                  data.config?.uses ? "actions/checkout@v4" : "./gradlew build"
                }
              />
            </div>
            {/* 추가 설정들 */}
            {Object.entries(data.config || {}).map(
              ([key, value]) =>
                key !== "name" &&
                key !== "uses" &&
                key !== "run" && (
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

StepNode.displayName = "StepNode";
