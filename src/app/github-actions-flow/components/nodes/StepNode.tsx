//* 인터랙티브 Step 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";

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

  return (
    <BaseNode
      icon={"🔧"}
      title="Step"
      isEditing={isEditing}
      onEdit={() => {
        if (!isEditing) setIsEditing(true);
      }}
      onSave={() => setIsEditing(false)}
      onDelete={(e) => {
        e.stopPropagation();
        deleteNode(id);
      }}
      handles={handles}
      className="step"
    >
      {!isEditing ? (
        <div className="node-view-mode">
          <div className="node-info">
            <div className="info-text">
              Step{" "}
              <span className="highlight">{data.config?.name || "Step"}</span>{" "}
              will execute{" "}
              <span className="highlight">
                {data.config?.uses ? "Action" : "Command"}
              </span>
              :{" "}
              <span className="highlight">
                {data.config?.uses || data.config?.run || ""}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="node-edit-mode">
          {/* Step 이름 설정 */}
          <div className="node-field">
            <label htmlFor={`step-name-${id}`} className="field-label">
              이름:
            </label>
            <input
              id={`step-name-${id}`}
              type="text"
              value={data.config?.name || "Step"}
              onChange={onStepNameChange}
              className="nodrag field-input"
              placeholder="Step name"
            />
          </div>
          {/* Step 타입 설정 */}
          <div className="node-field">
            <label htmlFor={`step-type-${id}`} className="field-label">
              타입:
            </label>
            <select
              id={`step-type-${id}`}
              value={data.config?.uses ? "action" : "command"}
              onChange={onStepTypeChange}
              className="nodrag field-input"
            >
              <option value="action">Action</option>
              <option value="command">Command</option>
            </select>
          </div>
          {/* Action/Command 설정 */}
          <div className="node-field">
            <label htmlFor={`step-action-${id}`} className="field-label">
              {data.config?.uses ? "Action:" : "Command:"}
            </label>
            <input
              id={`step-action-${id}`}
              type="text"
              value={data.config?.uses || data.config?.run || ""}
              onChange={onActionChange}
              className="nodrag field-input"
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
                <div key={key} className="node-field">
                  <div className="config-item">
                    <span className="config-key">{key}:</span>
                    <span className="config-value">{String(value)}</span>
                    <button
                      onClick={() => onRemoveConfig(key)}
                      className="remove-config-btn"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
          )}
          {/* 새로운 설정 추가 */}
          {showAddConfig ? (
            <div className="node-field">
              <div className="add-config-form">
                <input
                  type="text"
                  value={newConfigKey}
                  onChange={(e) => setNewConfigKey(e.target.value)}
                  placeholder="키"
                  className="nodrag field-input"
                />
                <input
                  type="text"
                  value={newConfigValue}
                  onChange={(e) => setNewConfigValue(e.target.value)}
                  placeholder="값"
                  className="nodrag field-input"
                />
                <button onClick={onAddConfig} className="add-config-btn">
                  추가
                </button>
                <button
                  onClick={() => setShowAddConfig(false)}
                  className="cancel-config-btn"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddConfig(true)}
              className="show-add-config-btn"
            >
              + 설정 추가
            </button>
          )}
        </div>
      )}
    </BaseNode>
  );
});

StepNode.displayName = "StepNode";
