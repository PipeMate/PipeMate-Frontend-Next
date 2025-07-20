//* 인터랙티브 워크플로우 트리거 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useNodeUpdate } from "../ReactFlowWorkspace";

export const WorkflowTriggerNode = memo(({ data, id }: NodeProps) => {
  const updateNodeData = useNodeUpdate();
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

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fef3c7",
        border: "2px solid #f59e0b",
        borderRadius: "8px",
        minWidth: "250px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 소스 핸들 - 다른 노드로 연결 가능 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#f59e0b",
          width: "8px",
          height: "8px",
        }}
      />

      {/* 노드 헤더 */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#92400e",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        🔄 워크플로우 기본 설정
      </div>

      {/* 워크플로우 이름 설정 */}
      <div style={{ marginBottom: "8px" }}>
        <label
          htmlFor={`workflow-name-${id}`}
          style={{
            fontSize: "12px",
            color: "#92400e",
            display: "block",
            marginBottom: "4px",
          }}
        >
          워크플로우 이름:
        </label>
        <input
          id={`workflow-name-${id}`}
          type="text"
          value={data.config?.name || "Java CICD"}
          onChange={onWorkflowNameChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #f59e0b",
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            color: "#92400e",
          }}
          placeholder="Java CICD"
        />
      </div>

      {/* 트리거 타입 설정 */}
      <div style={{ marginBottom: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            color: "#92400e",
            display: "block",
            marginBottom: "4px",
          }}
        >
          트리거 타입:
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {["push", "pull_request", "schedule", "workflow_dispatch"].map(
            (trigger) => (
              <button
                key={trigger}
                onClick={() => onTriggerToggle(trigger)}
                style={{
                  padding: "4px 8px",
                  fontSize: "10px",
                  backgroundColor: currentOn[trigger] ? "#f59e0b" : "#ffffff",
                  color: currentOn[trigger] ? "#ffffff" : "#92400e",
                  border: "1px solid #f59e0b",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {trigger}
              </button>
            )
          )}
        </div>
      </div>

      {/* 브랜치 설정 (push 또는 pull_request가 활성화된 경우) */}
      {(currentOn.push || currentOn.pull_request) && (
        <div style={{ marginBottom: "8px" }}>
          <label
            htmlFor={`branch-${id}`}
            style={{
              fontSize: "12px",
              color: "#92400e",
              display: "block",
              marginBottom: "4px",
            }}
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
            className="nodrag"
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid #f59e0b",
              borderRadius: "4px",
              backgroundColor: "#ffffff",
              color: "#92400e",
            }}
            placeholder="main"
          />
        </div>
      )}

      {/* 추가 설정들 */}
      {Object.entries(data.config || {}).map(([key, value]) => {
        if (key !== "name" && key !== "on") {
          return (
            <div
              key={key}
              style={{
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "10px", color: "#92400e", flex: 1 }}>
                {key}: {String(value)}
              </span>
              <button
                onClick={() => onRemoveConfig(key)}
                style={{
                  padding: "2px 4px",
                  fontSize: "8px",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          );
        }
        return null;
      })}

      {/* 설정 추가 버튼 */}
      <div style={{ marginTop: "8px" }}>
        {!showAddConfig ? (
          <button
            onClick={() => setShowAddConfig(true)}
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: "10px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➕ 설정 추가
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <input
              type="text"
              placeholder="키"
              value={newConfigKey}
              onChange={(e) => setNewConfigKey(e.target.value)}
              className="nodrag"
              style={{
                padding: "2px 4px",
                fontSize: "10px",
                border: "1px solid #f59e0b",
                borderRadius: "2px",
              }}
            />
            <input
              type="text"
              placeholder="값"
              value={newConfigValue}
              onChange={(e) => setNewConfigValue(e.target.value)}
              className="nodrag"
              style={{
                padding: "2px 4px",
                fontSize: "10px",
                border: "1px solid #f59e0b",
                borderRadius: "2px",
              }}
            />
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={onAddConfig}
                style={{
                  flex: 1,
                  padding: "2px 4px",
                  fontSize: "10px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddConfig(false);
                  setNewConfigKey("");
                  setNewConfigValue("");
                }}
                style={{
                  flex: 1,
                  padding: "2px 4px",
                  fontSize: "10px",
                  backgroundColor: "#6b7280",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 현재 설정 표시 */}
      <div
        style={{
          fontSize: "10px",
          color: "#92400e",
          opacity: 0.7,
          textAlign: "center",
          marginTop: "8px",
          padding: "4px",
          backgroundColor: "#fef3c7",
          borderRadius: "4px",
        }}
      >
        {data.config?.name || "Java CICD"} |{" "}
        {Object.keys(currentOn).join(", ") || "수동"}
      </div>
    </div>
  );
});

WorkflowTriggerNode.displayName = "WorkflowTriggerNode";
