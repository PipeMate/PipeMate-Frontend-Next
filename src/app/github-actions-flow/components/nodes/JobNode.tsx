//* 인터랙티브 Job 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";

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

  return (
    <div className="reactflow-node job">
      {/* 타겟 핸들 - 다른 노드에서 연결 받기 */}
      <Handle
        type="target"
        position={Position.Top}
        className="reactflow-handle"
      />

      {/* 소스 핸들 - 다른 노드로 연결 가능 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="reactflow-handle"
      />

      {/* 노드 내부 컨텐츠 */}
      <div
        className="node-content"
        onClick={() => {
          // 편집 모드가 아닐 때만 편집 모드로 전환
          if (!isEditing) {
            setIsEditing(true);
          }
        }}
      >
        {!isEditing ? (
          //* 기본 보기 모드
          <div className="node-view-mode">
            <div className="node-header">
              <span className="node-icon">⚙️</span>
              <span className="node-title">Job 설정</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(id);
                }}
                className="delete-node-btn"
                title="노드 삭제"
              >
                ×
              </button>
            </div>

            <div className="node-info">
              <div className="info-text">
                Job{" "}
                <span className="highlight">{data.label || "Job 설정"}</span>{" "}
                (ID: <span className="highlight">{jobKey}</span>) will run on{" "}
                <span className="highlight">
                  {jobConfig["runs-on"] || "ubuntu-latest"}
                </span>
                with{" "}
                <span className="highlight">{data.stepCount || 0} steps</span>.
              </div>
            </div>
          </div>
        ) : (
          //* 편집 모드
          <div className="node-edit-mode">
            <div className="node-header">
              <span className="node-icon">⚙️</span>
              <span className="node-title">Job 설정</span>
              <div className="header-buttons">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                  }}
                  className="save-btn"
                  title="저장"
                >
                  ✓
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(id);
                  }}
                  className="delete-node-btn"
                  title="노드 삭제"
                >
                  ×
                </button>
              </div>
            </div>

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
            {Object.entries(jobConfig).map(([key, value]) => {
              if (key !== "runs-on") {
                return (
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
                );
              }
              return null;
            })}

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
      </div>
    </div>
  );
});

JobNode.displayName = "JobNode";
