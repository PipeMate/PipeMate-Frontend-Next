//* 인터랙티브 Job 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useNodeUpdate } from "../ReactFlowWorkspace";

export const JobNode = memo(({ data, id }: NodeProps) => {
  const updateNodeData = useNodeUpdate();
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* Job 이름 변경 핸들러
  const onJobNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      const jobKey = Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";

      updateNodeData(id, {
        label: newName,
        config: {
          ...data.config,
          jobs: {
            [newName]: {
              ...data.config.jobs?.[jobKey],
            },
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* Job ID 변경 핸들러
  const onJobIdChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newJobId = evt.target.value;
      const currentJobKey =
        Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";
      const currentJobConfig = data.config.jobs?.[currentJobKey] || {};

      updateNodeData(id, {
        config: {
          ...data.config,
          jobs: {
            [newJobId]: currentJobConfig,
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* runs-on 변경 핸들러
  const onRunsOnChange = useCallback(
    (evt: React.ChangeEvent<HTMLSelectElement>) => {
      const newRunsOn = evt.target.value;
      const jobKey = Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";

      updateNodeData(id, {
        config: {
          ...data.config,
          jobs: {
            [jobKey]: {
              ...data.config.jobs?.[jobKey],
              "runs-on": newRunsOn,
            },
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 새로운 설정 추가 핸들러
  const onAddConfig = useCallback(() => {
    if (newConfigKey && newConfigValue) {
      const jobKey = Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";

      updateNodeData(id, {
        config: {
          ...data.config,
          jobs: {
            [jobKey]: {
              ...data.config.jobs?.[jobKey],
              [newConfigKey]: newConfigValue,
            },
          },
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
      const jobKey = Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";
      const newJobConfig = { ...data.config.jobs?.[jobKey] };
      delete newJobConfig[key];

      updateNodeData(id, {
        config: {
          ...data.config,
          jobs: {
            [jobKey]: newJobConfig,
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* Step 추가 핸들러
  const onAddStep = useCallback(() => {
    console.log("Step 추가 기능은 추후 구현 예정");
  }, []);

  const jobKey = Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";
  const jobConfig = data.config.jobs?.[jobKey] || {};

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#dbeafe",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
        minWidth: "250px",
        minHeight: "120px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 타겟 핸들 - 다른 노드에서 연결 받기 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#3b82f6",
          width: "8px",
          height: "8px",
        }}
      />

      {/* 소스 핸들 - 다른 노드로 연결 가능 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#3b82f6",
          width: "8px",
          height: "8px",
        }}
      />

      {/* 노드 헤더 */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#1e40af",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        ⚙️ Job 설정
      </div>

      {/* Job 이름 설정 */}
      <div style={{ marginBottom: "8px" }}>
        <label
          htmlFor={`job-name-${id}`}
          style={{
            fontSize: "12px",
            color: "#1e40af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Job 이름:
        </label>
        <input
          id={`job-name-${id}`}
          type="text"
          value={data.label || "Job 설정"}
          onChange={onJobNameChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #3b82f6",
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            color: "#1e40af",
          }}
          placeholder="Job 설정"
        />
      </div>

      {/* Job ID 설정 */}
      <div style={{ marginBottom: "8px" }}>
        <label
          htmlFor={`job-id-${id}`}
          style={{
            fontSize: "12px",
            color: "#1e40af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Job ID:
        </label>
        <input
          id={`job-id-${id}`}
          type="text"
          value={jobKey}
          onChange={onJobIdChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #3b82f6",
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            color: "#1e40af",
          }}
          placeholder="ci-pipeline"
        />
      </div>

      {/* runs-on 설정 */}
      <div style={{ marginBottom: "8px" }}>
        <label
          htmlFor={`runs-on-${id}`}
          style={{
            fontSize: "12px",
            color: "#1e40af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          실행 환경:
        </label>
        <select
          id={`runs-on-${id}`}
          value={jobConfig["runs-on"] || "ubuntu-latest"}
          onChange={onRunsOnChange}
          className="nodrag"
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #3b82f6",
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            color: "#1e40af",
          }}
        >
          <option value="ubuntu-latest">Ubuntu Latest</option>
          <option value="ubuntu-22.04">Ubuntu 22.04</option>
          <option value="ubuntu-20.04">Ubuntu 20.04</option>
          <option value="windows-latest">Windows Latest</option>
          <option value="macos-latest">macOS Latest</option>
          <option value="self-hosted">Self Hosted</option>
        </select>
      </div>

      {/* 추가 설정들 */}
      {Object.entries(jobConfig).map(([key, value]) => {
        if (key !== "runs-on") {
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
              <span style={{ fontSize: "10px", color: "#1e40af", flex: 1 }}>
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
                border: "1px solid #3b82f6",
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
                border: "1px solid #3b82f6",
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

      {/* Step 추가 버튼 */}
      <div style={{ marginTop: "8px" }}>
        <button
          onClick={onAddStep}
          style={{
            width: "100%",
            padding: "6px 8px",
            fontSize: "11px",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          ➕ Step 추가
        </button>
      </div>

      {/* 현재 설정 표시 */}
      <div
        style={{
          fontSize: "10px",
          color: "#1e40af",
          opacity: 0.7,
          textAlign: "center",
          marginTop: "8px",
          padding: "4px",
          backgroundColor: "#dbeafe",
          borderRadius: "4px",
        }}
      >
        {data.label || "Job 설정"} | {jobKey} |{" "}
        {jobConfig["runs-on"] || "ubuntu-latest"}
      </div>
    </div>
  );
});

JobNode.displayName = "JobNode";
