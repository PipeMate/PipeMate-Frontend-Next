//* 인터랙티브 워크플로우 트리거 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";

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

  return (
    <BaseNode
      icon={"🔄"}
      title="워크플로우 트리거"
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
      className="workflow-trigger"
    >
      {!isEditing ? (
        <div className="node-view-mode">
          <div className="node-info">
            <div className="info-text">
              Workflow{" "}
              <span className="highlight">
                {data.config?.name || "My Workflow"}
              </span>{" "}
              triggers on{" "}
              <span className="highlight">
                {activeTriggers.length > 0
                  ? activeTriggers.join(", ")
                  : "manual"}
              </span>
              {(currentOn.push || currentOn.pull_request) && (
                <>
                  {" "}
                  for branch{" "}
                  <span className="highlight">
                    {currentOn.push?.branches?.[0] ||
                      currentOn.pull_request?.branches?.[0] ||
                      "main"}
                  </span>
                </>
              )}
              .
            </div>
          </div>
        </div>
      ) : (
        <div className="node-edit-mode">
          {/* 워크플로우 이름 설정 */}
          <div className="node-field">
            <label htmlFor={`workflow-name-${id}`} className="field-label">
              워크플로우 이름:
            </label>
            <input
              id={`workflow-name-${id}`}
              type="text"
              value={data.config?.name || "My Workflow"}
              onChange={onWorkflowNameChange}
              className="nodrag field-input"
              placeholder="My Workflow"
            />
          </div>
          {/* 트리거 타입 설정 */}
          <div className="node-field">
            <label className="field-label">트리거 타입:</label>
            <div className="trigger-buttons">
              {["push", "pull_request", "schedule", "workflow_dispatch"].map(
                (trigger) => (
                  <button
                    key={trigger}
                    onClick={() => onTriggerToggle(trigger)}
                    className={`trigger-button ${
                      currentOn[trigger] ? "active" : ""
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
            <div className="node-field">
              <label htmlFor={`branch-${id}`} className="field-label">
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
                className="nodrag field-input"
                placeholder="main"
              />
            </div>
          )}
          {/* 추가 설정들 */}
          {Object.entries(data.config || {}).map(
            ([key, value]) =>
              key !== "name" &&
              key !== "on" && (
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

WorkflowTriggerNode.displayName = "WorkflowTriggerNode";
