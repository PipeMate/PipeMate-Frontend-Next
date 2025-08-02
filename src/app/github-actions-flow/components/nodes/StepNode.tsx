//* 인터랙티브 Step 노드 컴포넌트
//* GitHub Actions Step 실행을 관리하는 노드 - Action 또는 Command 실행
"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import { Position, NodeProps } from "@xyflow/react";
import { useNodeUpdate } from "../ReactFlowWorkspace";
import BaseNode from "./BaseNode";
import { Plus, X, Check } from "lucide-react";
import { NodeContext } from "./BaseNode";
import { NodeTypeBadge } from "./NodeTypeBadge";
import {
  NODE_COLORS,
  NODE_HANDLE_CONFIGS,
  getNodeIcon,
  NODE_TITLES,
  getDomainColor,
} from "../../constants/nodeConstants";

//* Step 노드 컴포넌트 - GitHub Actions Step 실행 관리
export const StepNode = memo(({ data, id }: NodeProps) => {
  //* 노드 데이터 업데이트 훅 - ReactFlowWorkspace에서 제공
  const updateNodeData = useNodeUpdate();

  //* 새로운 설정 추가 UI 상태 관리
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");

  //* 노드 크기 측정을 위한 ref
  const nodeRef = useRef<HTMLDivElement>(null);

  //* 편집 모드 상태 (외부에서 전달받음)
  const isEditing = (data.isEditing as boolean) || false;

  //* 노드 크기 측정 및 저장 - 동적 크기 조절을 위해
  useEffect(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      if (data.width !== rect.width || data.height !== rect.height) {
        updateNodeData(id, { width: rect.width, height: rect.height });
      }
    }
  }, [id, data.width, data.height, isEditing, data.config, updateNodeData]);

  //* Step 이름 변경 핸들러 - Step의 표시 이름
  const onStepNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newName = evt.target.value;
      updateNodeData(id, {
        label: newName,
        config: {
          ...(data.config as Record<string, unknown>),
          name: newName,
        },
      });
    },
    [id, data.config, updateNodeData]
  );

  //* Step 타입 변경 핸들러 - Action vs Command 선택
  const onStepTypeChange = useCallback(
    (evt: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = evt.target.value;
      const currentConfig = (data.config as Record<string, unknown>) || {};

      if (newType === "action") {
        //* Action 타입으로 변경 - uses 속성 사용
        updateNodeData(id, {
          config: {
            ...currentConfig,
            uses: currentConfig.uses || "actions/checkout@v4",
            run: undefined, //* Command 속성 제거
          },
        });
      } else {
        //* Command 타입으로 변경 - run 속성 사용
        updateNodeData(id, {
          config: {
            ...currentConfig,
            run: currentConfig.run || "./gradlew build",
            uses: undefined, //* Action 속성 제거
          },
        });
      }
    },
    [id, data.config, updateNodeData]
  );

  //* Action/Command 변경 핸들러 - 실제 실행할 명령어나 액션
  const onActionChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = evt.target.value;
      const currentConfig = (data.config as Record<string, unknown>) || {};

      if (currentConfig.uses) {
        //* Action 타입인 경우 uses 속성 업데이트
        updateNodeData(id, {
          config: {
            ...currentConfig,
            uses: newValue,
          },
        });
      } else {
        //* Command 타입인 경우 run 속성 업데이트
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

  //* 새로운 설정 추가 핸들러 - 동적으로 Step 설정 추가
  const onAddConfig = useCallback(() => {
    if (newConfigKey && newConfigValue) {
      updateNodeData(id, {
        config: {
          ...(data.config as Record<string, unknown>),
          [newConfigKey]: newConfigValue,
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
      const currentConfig = (data.config as Record<string, unknown>) || {};
      const newConfig = { ...currentConfig };
      delete newConfig[key];
      updateNodeData(id, {
        config: newConfig,
      });
    },
    [id, data.config, updateNodeData]
  );

  //* 핸들 설정 - Step 노드의 연결점 정의
  const handles = NODE_HANDLE_CONFIGS.STEP.map((handle) => ({
    ...handle,
    position: handle.position as Position,
  }));

  //* Step 노드 전용 색상 - 도메인별로 동적 적용
  const domain = (data.domain as string) || "github";
  const colors = getDomainColor(domain);

  //* 현재 Step 설정 데이터 추출
  const config = data.config as Record<string, unknown>;

  return (
    <NodeContext.Provider value={{}}>
      <div ref={nodeRef}>
        <BaseNode
          icon={getNodeIcon("STEP")}
          title={(config.name as string) || "Step"}
          description={
            (data.description as string) || "GitHub Actions Step 실행"
          }
          domain={data.domain as string}
          task={data.task as string[]}
          handles={handles}
          bgColor={colors.bg}
          borderColor={colors.border}
          textColor={colors.text}
          nodeTypeBadge={<NodeTypeBadge type="STEP" category={domain} />} //* 노드 타입 뱃지
        >
          {!isEditing ? (
            //* 읽기 모드: Step 정보 표시 - 간단한 요약 정보
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-700">
                <span
                  className="font-bold rounded px-1"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.bg,
                  }}
                >
                  {(data.config as Record<string, unknown>)?.uses
                    ? "Action"
                    : "Command"}
                </span>
                :
                <span
                  className="font-bold rounded px-1"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.bg,
                  }}
                >
                  {((data.config as Record<string, unknown>)?.uses as string) ||
                    ((data.config as Record<string, unknown>)?.run as string) ||
                    ""}
                </span>
              </div>
            </div>
          ) : (
            //* 편집 모드: Step 설정 편집 UI - 상세 설정 가능
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
                  value={(config.name as string) || "Step"}
                  onChange={onStepNameChange}
                  className={`nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:border-${colors.border} focus:ring-${colors.border}-500`}
                  placeholder="Step name"
                />
              </div>

              {/* Step 타입 설정 - Action vs Command */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`step-type-${id}`}
                  className="text-xs font-medium text-gray-600"
                >
                  타입:
                </label>
                <select
                  id={`step-type-${id}`}
                  value={config.uses ? "action" : "command"}
                  onChange={onStepTypeChange}
                  className={`nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:border-${colors.border} focus:ring-${colors.border}-500`}
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
                  {(data.config as Record<string, unknown>)?.uses
                    ? "Action:"
                    : "Command:"}
                </label>
                <input
                  id={`step-action-${id}`}
                  type="text"
                  value={
                    ((data.config as Record<string, unknown>)
                      ?.uses as string) ||
                    ((data.config as Record<string, unknown>)?.run as string) ||
                    ""
                  }
                  onChange={onActionChange}
                  className={`nodrag px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:border-${colors.border} focus:ring-${colors.border}-500`}
                  placeholder={
                    (data.config as Record<string, unknown>)?.uses
                      ? "actions/checkout@v4"
                      : "./gradlew build"
                  }
                />
              </div>

              {/* 추가 설정들 - 동적으로 추가된 설정들 표시 */}
              {Object.entries(
                (data.config as Record<string, unknown>) || {}
              ).map(
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

              {/* 새로운 설정 추가 UI */}
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
      </div>
    </NodeContext.Provider>
  );
});

StepNode.displayName = "StepNode";
