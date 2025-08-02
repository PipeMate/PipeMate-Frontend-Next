//* 인터랙티브 Job 노드 컴포넌트
//* GitHub Actions Job 설정을 관리하는 노드 - runs-on, job-id, 추가 설정 등
"use client";

import { memo, useCallback, useState } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { useNodeUpdate } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";
import { Plus, X, Check } from "lucide-react";
import { NodeContext } from "./BaseNode";
import { NodeTypeBadge } from "./NodeTypeBadge";
import {
  NODE_TITLES,
  NODE_COLORS,
  getNodeIcon,
  NODE_HANDLE_CONFIGS,
} from "../../constants/nodeConstants";

//* Job 노드 컴포넌트 - GitHub Actions Job 설정 관리
export const JobNode = memo(({ data, id }: NodeProps) => {
  //* 노드 데이터 업데이트 훅 - ReactFlowWorkspace에서 제공
  const updateNodeData = useNodeUpdate();

  //* 새로운 설정 추가 UI 상태 관리
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* 편집 모드 상태 (외부에서 전달받음)
  const isEditing = (data.isEditing as boolean) || false;

  //* Job 이름 변경 핸들러 - 워크플로우에서 표시될 이름
  const onJobNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      const config = data.config as Record<string, unknown>;
      const jobs = config.jobs as Record<string, unknown> | undefined;
      const jobKey = Object.keys(jobs || {})[0] || "ci-pipeline";
      const currentJobConfig =
        (jobs?.[jobKey] as Record<string, unknown>) || {};

      updateNodeData(id, {
        label: newName,
        config: {
          ...(data.config as Record<string, unknown>),
          jobs: {
            [newName]: {
              ...currentJobConfig,
            },
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* Job ID 변경 핸들러 - GitHub Actions에서 사용할 실제 job-id
  const onJobIdChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newJobId = evt.target.value;
      const config = data.config as Record<string, unknown>;
      const jobs = config.jobs as Record<string, unknown> | undefined;
      const currentJobKey = Object.keys(jobs || {})[0] || "ci-pipeline";
      const currentJobConfig =
        (jobs?.[currentJobKey] as Record<string, unknown>) || {};

      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          jobs: {
            [newJobId]: currentJobConfig, //* config.jobs의 키를 새로운 job-id로 변경
          },
        },
        jobName: newJobId, //* job-name도 함께 업데이트하여 연결된 Step들 자동 갱신
      });
    },
    [id, data.config, updateNodeData]
  );

  //* runs-on 변경 핸들러 - 실행 환경 설정 (ubuntu-latest, windows-latest 등)
  const onRunsOnChange = useCallback(
    (evt: React.ChangeEvent<HTMLSelectElement>) => {
      const newRunsOn = evt.target.value;
      const config = data.config as Record<string, unknown>;
      const jobs = config.jobs as Record<string, unknown> | undefined;
      const jobKey = Object.keys(jobs || {})[0] || "ci-pipeline";
      const currentJobConfig =
        (jobs?.[jobKey] as Record<string, unknown>) || {};

      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          jobs: {
            [jobKey]: {
              ...currentJobConfig,
              "runs-on": newRunsOn,
            },
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 새로운 설정 추가 핸들러 - 동적으로 Job 설정 추가
  const onAddConfig = useCallback(() => {
    if (newConfigKey && newConfigValue) {
      const config = data.config as Record<string, unknown>;
      const jobs = config.jobs as Record<string, unknown> | undefined;
      const jobKey = Object.keys(jobs || {})[0] || "ci-pipeline";
      const currentJobConfig =
        (jobs?.[jobKey] as Record<string, unknown>) || {};

      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          jobs: {
            [jobKey]: {
              ...currentJobConfig,
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

  //* 설정 삭제 핸들러 - 동적으로 추가된 설정 제거
  const onRemoveConfig = useCallback(
    (key: string) => {
      const config = data.config as Record<string, unknown>;
      const jobs = config.jobs as Record<string, unknown> | undefined;
      const jobKey = Object.keys(jobs || {})[0] || "ci-pipeline";
      const currentJobConfig =
        (jobs?.[jobKey] as Record<string, unknown>) || {};
      const newJobConfig = { ...currentJobConfig };
      delete newJobConfig[key];

      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          jobs: {
            [jobKey]: newJobConfig,
          },
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 현재 Job 설정 데이터 추출
  const config = data.config as Record<string, unknown>;
  const jobs = config.jobs as Record<string, unknown> | undefined;
  const jobKey = Object.keys(jobs || {})[0] || "ci-pipeline";
  const jobConfig = (jobs?.[jobKey] as Record<string, unknown>) || {};

  //* Job 노드 전용 색상 - 파랑색 계열로 구분 (워크플로우와 동일)
  const colors = NODE_COLORS.JOB;
  const handles = NODE_HANDLE_CONFIGS.JOB.map((handle) => ({
    ...handle,
    position: handle.position as Position,
  }));

  return (
    <NodeContext.Provider value={{}}>
      <BaseNode
        icon={getNodeIcon("JOB")}
        title={(data.label as string) || "Job 설정"}
        description={(data.description as string) || "GitHub Actions Job 설정"}
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
        nodeTypeBadge={<NodeTypeBadge type="JOB" />} //* 노드 타입 뱃지
      >
        {!isEditing ? (
          //* 읽기 모드: Job 정보 표시 - 간단한 요약 정보
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-700">
              Job ID:{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {jobKey}
              </span>{" "}
              runs on{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {(jobConfig["runs-on"] as string) || "ubuntu-latest"}
              </span>{" "}
              with{" "}
              <span className="font-bold text-blue-500 bg-blue-100 rounded px-1">
                {(data.stepCount as number) || 0} steps
              </span>
            </div>
          </div>
        ) : (
          //* 편집 모드: Job 설정 편집 UI - 상세 설정 가능
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
                value={(data.label as string) || "Job 설정"}
                onChange={onJobNameChange}
                className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Job 설정"
              />
            </div>

            {/* Job ID 설정 */}
            <div className="flex flex-col gap-1">
              <label
                id={`job-id-${id}`}
                className="text-xs font-medium text-gray-600"
              >
                Job ID:
              </label>
              <input
                id={`job-id-${id}`}
                type="text"
                value={jobKey}
                onChange={onJobIdChange}
                className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                value={(jobConfig["runs-on"] as string) || "ubuntu-latest"}
                onChange={onRunsOnChange}
                className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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

            {/* 추가 설정들 - 동적으로 추가된 설정들 표시 */}
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
                        className="bg-red-500 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-all duration-200 hover:scale-105"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
            )}

            {/* 새로운 설정 추가 UI */}
            {showAddConfig ? (
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={newConfigKey}
                    onChange={(e) => setNewConfigKey(e.target.value)}
                    placeholder="키"
                    className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={newConfigValue}
                    onChange={(e) => setNewConfigValue(e.target.value)}
                    placeholder="값"
                    className="nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={onAddConfig}
                      className="bg-emerald-500 text-white rounded-lg px-3 py-2 text-sm hover:bg-emerald-600 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <Check size={16} /> 추가
                    </button>
                    <button
                      onClick={() => setShowAddConfig(false)}
                      className="bg-gray-500 text-white rounded-lg px-3 py-2 text-sm hover:bg-gray-600 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <X size={16} /> 취소
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddConfig(true)}
                className="w-full bg-emerald-500 text-white rounded-lg px-4 py-3 text-sm hover:bg-emerald-600 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Plus size={18} /> 설정 추가
              </button>
            )}
          </div>
        )}
      </BaseNode>
    </NodeContext.Provider>
  );
});

JobNode.displayName = "JobNode";
