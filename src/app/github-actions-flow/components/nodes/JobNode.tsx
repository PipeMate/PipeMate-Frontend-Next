//* 인터랙티브 Job 노드 컴포넌트
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "reactflow";
import { useNodeUpdate, useNodeDelete } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";
import { Cog, Plus, X, Check } from "lucide-react";
import { NodeContext } from "./BaseNode";

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

  // Job 노드 전용 색상
  const colors = { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" };

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
        icon={<Cog size={18} />}
        title="Job 설정"
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
      >
        {!isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-700">
              Job{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {data.label || "Job 설정"}
              </span>
              (ID:{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {jobKey}
              </span>
              ) will run on{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {jobConfig["runs-on"] || "ubuntu-latest"}
              </span>{" "}
              with{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {data.stepCount || 0} steps
              </span>
              .
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Job 이름 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`job-name-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                Job 이름:
              </label>
              <input
                id={`job-name-${id}`}
                type="text"
                value={data.label || "Job 설정"}
                onChange={onJobNameChange}
                className="nodrag px-2 py-1 border rounded text-xs"
                placeholder="Job 설정"
              />
            </div>
            {/* Job ID 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`job-id-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                Job ID:
              </label>
              <input
                id={`job-id-${id}`}
                type="text"
                value={jobKey}
                onChange={onJobIdChange}
                className="nodrag px-2 py-1 border rounded text-xs"
                placeholder="ci-pipeline"
              />
            </div>
            {/* runs-on 설정 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`runs-on-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                실행 환경:
              </label>
              <select
                id={`runs-on-${id}`}
                value={jobConfig["runs-on"] || "ubuntu-latest"}
                onChange={onRunsOnChange}
                className="nodrag px-2 py-1 border rounded text-xs"
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

JobNode.displayName = "JobNode";
