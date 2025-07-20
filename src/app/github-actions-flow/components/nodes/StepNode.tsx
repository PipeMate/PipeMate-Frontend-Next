//* 인터랙티브 Step 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useNodeUpdate } from "../ReactFlowWorkspace";

export const StepNode = memo(({ data, id }: NodeProps) => {
  const updateNodeData = useNodeUpdate();
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* Step 타입에 따른 색상 결정
  const getStepColor = () => {
    const stepType = data.label?.toLowerCase() || "";
    if (stepType.includes("checkout"))
      return { bg: "#ecfdf5", border: "#10b981" };
    if (stepType.includes("java") || stepType.includes("setup"))
      return { bg: "#fef3c7", border: "#f59e0b" };
    if (stepType.includes("build")) return { bg: "#dbeafe", border: "#3b82f6" };
    if (stepType.includes("test")) return { bg: "#fce7f3", border: "#ec4899" };
    if (stepType.includes("docker"))
      return { bg: "#e0e7ff", border: "#6366f1" };
    if (stepType.includes("deploy") || stepType.includes("ssh"))
      return { bg: "#fef2f2", border: "#ef4444" };
    return { bg: "#f3f4f6", border: "#6b7280" };
  };

  const colors = getStepColor();

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

  //* Step 삭제 핸들러
  const onDeleteStep = useCallback(() => {
    console.log("Step 삭제 기능은 추후 구현 예정");
  }, []);

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: "6px",
        minWidth: "200px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 타겟 핸들 - 다른 노드에서 연결 받기 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: "6px",
          height: "6px",
        }}
      />

      {/* 소스 핸들 - 다른 노드로 연결 가능 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: "6px",
          height: "6px",
        }}
      />

      {/* 노드 헤더 */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: colors.border,
          marginBottom: "8px",
          textAlign: "center",
        }}
      >
        🔧 Step
      </div>

      {/* Step 이름 설정 */}
      <div style={{ marginBottom: "6px" }}>
        <label
          htmlFor={`step-name-${id}`}
          style={{
            fontSize: "10px",
            color: colors.border,
            display: "block",
            marginBottom: "2px",
          }}
        >
          이름:
        </label>
        <input
          id={`step-name-${id}`}
          type="text"
          value={data.config?.name || "Step"}
          onChange={onStepNameChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "3px 6px",
            fontSize: "10px",
            border: `1px solid ${colors.border}`,
            borderRadius: "3px",
            backgroundColor: "#ffffff",
            color: colors.border,
          }}
          placeholder="Step name"
        />
      </div>

      {/* Step 타입 설정 */}
      <div style={{ marginBottom: "6px" }}>
        <label
          htmlFor={`step-type-${id}`}
          style={{
            fontSize: "10px",
            color: colors.border,
            display: "block",
            marginBottom: "2px",
          }}
        >
          타입:
        </label>
        <select
          id={`step-type-${id}`}
          value={data.config?.uses ? "action" : "command"}
          onChange={onStepTypeChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "3px 6px",
            fontSize: "10px",
            border: `1px solid ${colors.border}`,
            borderRadius: "3px",
            backgroundColor: "#ffffff",
            color: colors.border,
          }}
        >
          <option value="action">Action</option>
          <option value="command">Command</option>
        </select>
      </div>

      {/* Action/Command 설정 */}
      <div style={{ marginBottom: "6px" }}>
        <label
          htmlFor={`step-action-${id}`}
          style={{
            fontSize: "10px",
            color: colors.border,
            display: "block",
            marginBottom: "2px",
          }}
        >
          {data.config?.uses ? "Action" : "Command"}:
        </label>
        <input
          id={`step-action-${id}`}
          type="text"
          value={data.config?.uses || data.config?.run || ""}
          onChange={onActionChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "3px 6px",
            fontSize: "10px",
            border: `1px solid ${colors.border}`,
            borderRadius: "3px",
            backgroundColor: "#ffffff",
            color: colors.border,
          }}
          placeholder={
            data.config?.uses ? "actions/checkout@v4" : "./gradlew build"
          }
        />
      </div>

      {/* 추가 설정들 */}
      {Object.entries(data.config || {}).map(([key, value]) => {
        if (key !== "name" && key !== "uses" && key !== "run") {
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
              <span style={{ fontSize: "9px", color: colors.border, flex: 1 }}>
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
      <div style={{ marginTop: "6px" }}>
        {!showAddConfig ? (
          <button
            onClick={() => setShowAddConfig(true)}
            style={{
              width: "100%",
              padding: "3px 6px",
              fontSize: "9px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            ➕ 설정 추가
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <input
              type="text"
              placeholder="키"
              value={newConfigKey}
              onChange={(e) => setNewConfigKey(e.target.value)}
              className="nodrag"
              style={{
                padding: "2px 4px",
                fontSize: "9px",
                border: `1px solid ${colors.border}`,
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
                fontSize: "9px",
                border: `1px solid ${colors.border}`,
                borderRadius: "2px",
              }}
            />
            <div style={{ display: "flex", gap: "3px" }}>
              <button
                onClick={onAddConfig}
                style={{
                  flex: 1,
                  padding: "2px 4px",
                  fontSize: "9px",
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
                  fontSize: "9px",
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

      {/* Step 삭제 버튼 */}
      <div style={{ marginTop: "6px" }}>
        <button
          onClick={onDeleteStep}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: "9px",
            backgroundColor: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#ef4444";
          }}
        >
          🗑️ 삭제
        </button>
      </div>

      {/* 현재 설정 표시 */}
      <div
        style={{
          fontSize: "9px",
          color: colors.border,
          opacity: 0.7,
          textAlign: "center",
          marginTop: "6px",
          padding: "3px",
          backgroundColor: colors.bg,
          borderRadius: "3px",
        }}
      >
        {data.config?.name || "Step"} |{" "}
        {data.config?.uses || data.config?.run || "Action"}
      </div>
    </div>
  );
});

StepNode.displayName = "StepNode";
