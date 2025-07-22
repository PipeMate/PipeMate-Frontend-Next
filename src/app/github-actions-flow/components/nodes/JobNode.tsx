//* 인터랙티브 Job 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";

export const JobNode = memo(({ data, id }: NodeProps) => {
  const updateNodeData = useNodeUpdate();
  const deleteNode = useNodeDelete();
  const [isEditing, setIsEditing] = useState(false);
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

  const jobKey = Object.keys(data.config?.jobs || {})[0] || "ci-pipeline";
  const jobConfig = data.config.jobs?.[jobKey] || {};

  // 핸들 설정
  const handles = [
    {
      type: "target" as const,
      position: Position.Top,
      className: "reactflow-handle",
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      className: "reactflow-handle",
    },
    {
      type: "source" as const,
      position: Position.Right,
      className: "reactflow-handle step-connection",
      style: { right: -4, top: "50%", transform: "translateY(-50%)" },
    },
  ];

  return (
    <BaseNode
      icon={"⚙️"}
      title="Job 설정"
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
      className="job"
    >
      {!isEditing ? (
        <div className="node-view-mode">
          <div className="node-info">
            <div className="info-text">
              Job <span className="highlight">{data.label || "Job 설정"}</span>{" "}
              (ID: <span className="highlight">{jobKey}</span>) will run on{" "}
              <span className="highlight">
                {jobConfig["runs-on"] || "ubuntu-latest"}
              </span>{" "}
              with{" "}
              <span className="highlight">{data.stepCount || 0} steps</span>.
            </div>
          </div>
        </div>
      ) : (
        <div className="node-edit-mode">
          {/* Job 이름 설정 */}
          <div className="node-field">
            <label htmlFor={`job-name-${id}`} className="field-label">
              Job 이름:
            </label>
            <input
              id={`job-name-${id}`}
              type="text"
              value={data.label || "Job 설정"}
              onChange={onJobNameChange}
              className="nodrag field-input"
              placeholder="Job 설정"
            />
          </div>
          {/* Job ID 설정 */}
          <div className="node-field">
            <label htmlFor={`job-id-${id}`} className="field-label">
              Job ID:
            </label>
            <input
              id={`job-id-${id}`}
              type="text"
              value={jobKey}
              onChange={onJobIdChange}
              className="nodrag field-input"
              placeholder="ci-pipeline"
            />
          </div>
          {/* runs-on 설정 */}
          <div className="node-field">
            <label htmlFor={`runs-on-${id}`} className="field-label">
              실행 환경:
            </label>
            <select
              id={`runs-on-${id}`}
              value={jobConfig["runs-on"] || "ubuntu-latest"}
              onChange={onRunsOnChange}
              className="nodrag field-input"
            >
              <option value="ubuntu-latest">Ubuntu Latest</option>
              <option value="ubuntu-22.04">Ubuntu 22.04</option>
              <option value="ubuntu-20.04">Ubuntu 20.04</option>
              <option value="windows-latest">Windows Latest</option>
              <option value="macos-latest">macOS Latest</option>
              <option value="macos-13">macOS 13</option>
              <option value="macos-12">macOS 12</option>
            </select>
          </div>
          {/* 추가 설정들 */}
          {Object.entries(jobConfig).map(
            ([key, value]) =>
              key !== "runs-on" && (
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

JobNode.displayName = "JobNode";
