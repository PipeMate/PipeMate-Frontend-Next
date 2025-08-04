//* ========================================
//* YAML 미리보기 패널 컴포넌트
//* ========================================
//* 이 컴포넌트는 선택된 블록의 YAML과 전체 워크플로우 YAML을
//* 실시간으로 미리보기하고 복사/다운로드 기능을 제공합니다.

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ServerBlock } from "../types";
import { generateBlockYaml, generateFullYaml } from "../utils/yamlGenerator";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  Play,
  Settings,
} from "lucide-react";

//* ========================================
//* Props 타입 정의
//* ========================================

interface YamlPreviewPanelProps {
  blocks: ServerBlock[]; //* 전체 블록 배열
  selectedBlock?: ServerBlock; //* 선택된 블록 (선택적)
  isEditing?: boolean; //* 편집 모드 상태
  onBlockUpdate?: (updatedBlock: ServerBlock) => void; //* 블록 업데이트 콜백
}

//* ========================================
//* 워크플로우 구조 타입 정의
//* ========================================

interface WorkflowStructure {
  trigger?: ServerBlock;
  jobs: {
    [jobName: string]: {
      job: ServerBlock;
      steps: ServerBlock[];
    };
  };
}

//* ========================================
//* 워크플로우 구조 분석 함수
//* ========================================

const analyzeWorkflowStructure = (blocks: ServerBlock[]): WorkflowStructure => {
  const structure: WorkflowStructure = {
    jobs: {},
  };

  // blocks가 없거나 빈 배열인 경우 안전하게 처리
  if (!blocks || blocks.length === 0) {
    return structure;
  }

  blocks.forEach((block) => {
    if (!block || !block.type) return; // 안전한 체크 추가

    if (block.type === "trigger") {
      structure.trigger = block;
    } else if (block.type === "job") {
      const jobName = block["job-name"] || "unknown";
      structure.jobs[jobName] = {
        job: block,
        steps: [],
      };
    } else if (block.type === "step") {
      const jobName = block["job-name"] || "unknown";
      if (!structure.jobs[jobName]) {
        structure.jobs[jobName] = {
          job: {
            name: jobName,
            type: "job",
            "job-name": jobName,
          } as ServerBlock,
          steps: [],
        };
      }
      structure.jobs[jobName].steps.push(block);
    }
  });

  return structure;
};

//* ========================================
//* 트리 뷰 컴포넌트
//* ========================================

interface TreeViewProps {
  structure: WorkflowStructure;
  onBlockSelect?: (block: ServerBlock) => void;
  selectedBlock?: ServerBlock;
}

const TreeView: React.FC<TreeViewProps> = ({
  structure,
  onBlockSelect,
  selectedBlock,
}) => {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const toggleJob = (jobName: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobName)) {
      newExpanded.delete(jobName);
    } else {
      newExpanded.add(jobName);
    }
    setExpandedJobs(newExpanded);
  };

  const isSelected = (block: ServerBlock) => {
    return (
      selectedBlock?.name === block.name && selectedBlock?.type === block.type
    );
  };

  // 안전한 렌더링을 위한 체크
  if (!structure || !structure.jobs) {
    return (
      <div className="text-center text-gray-500 py-4">
        워크플로우 구조를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Trigger */}
      {structure.trigger && (
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected(structure.trigger)
              ? "bg-blue-100 border border-blue-300"
              : "hover:bg-gray-50"
          }`}
          onClick={() => onBlockSelect?.(structure.trigger!)}
        >
          <Play size={16} className="text-blue-600" />
          <span className="text-sm font-medium">{structure.trigger.name}</span>
          <span className="text-xs text-gray-500">(Trigger)</span>
        </div>
      )}

      {/* Jobs */}
      {Object.entries(structure.jobs).map(([jobName, jobData]) => (
        <div key={jobName} className="border border-gray-200 rounded">
          <div
            className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
              isSelected(jobData.job)
                ? "bg-green-100 border-b border-green-300"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onBlockSelect?.(jobData.job)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleJob(jobName);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expandedJobs.has(jobName) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            <Folder size={16} className="text-green-600" />
            <span className="text-sm font-medium">{jobData.job.name}</span>
            <span className="text-xs text-gray-500">({jobName})</span>
            <span className="text-xs text-gray-400 ml-auto">
              {jobData.steps.length} steps
            </span>
          </div>

          {/* Steps */}
          {expandedJobs.has(jobName) && (
            <div className="bg-gray-50 border-t border-gray-200">
              {jobData.steps.map((step, index) => (
                <div
                  key={`${jobName}-${index}`}
                  className={`flex items-center gap-2 p-2 ml-4 cursor-pointer transition-colors ${
                    isSelected(step)
                      ? "bg-orange-100 border border-orange-300"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => onBlockSelect?.(step)}
                >
                  <File size={14} className="text-orange-600" />
                  <span className="text-sm">{step.name}</span>
                  <span className="text-xs text-gray-500">
                    (Step {index + 1})
                  </span>
                </div>
              ))}
              {jobData.steps.length === 0 && (
                <div className="flex items-center gap-2 p-2 ml-4 text-gray-400">
                  <File size={14} />
                  <span className="text-sm">No steps</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {Object.keys(structure.jobs).length === 0 && (
        <div className="text-center text-gray-500 py-4">No jobs configured</div>
      )}
    </div>
  );
};

//* ========================================
//* YAML 미리보기 패널 컴포넌트
//* ========================================

export const YamlPreviewPanel = ({
  blocks,
  selectedBlock,
  isEditing = false,
  onBlockUpdate,
}: YamlPreviewPanelProps) => {
  //* 뷰 모드 상태 (블록별 / 전체 / 트리) - 기본값을 "block"으로 변경
  const [viewMode, setViewMode] = useState<"block" | "full" | "tree">("block");
  const [editableYaml, setEditableYaml] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  //* 워크플로우 구조 분석 - 안전한 처리 추가
  const workflowStructure = useMemo(() => {
    try {
      const structure = analyzeWorkflowStructure(blocks || []);
      return structure;
    } catch (error) {
      console.error("워크플로우 구조 분석 오류:", error);
      return { jobs: {} };
    }
  }, [blocks]);

  //* 편집 모드가 활성화되면 YAML을 편집 가능한 상태로 설정
  useEffect(() => {
    if (isEditing && selectedBlock) {
      const yaml = generateBlockYaml(selectedBlock);
      setEditableYaml(yaml);
    }
  }, [isEditing, selectedBlock]);

  //* ========================================
  //* YAML 생성 함수들
  //* ========================================

  //* 선택된 블록의 YAML 생성
  //? 선택된 블록이 있으면 해당 블록의 YAML을, 없으면 안내 메시지를 반환
  const getBlockYaml = useCallback(() => {
    if (selectedBlock) {
      return generateBlockYaml(selectedBlock);
    }
    return "# 블록을 선택하여 YAML을 확인하세요";
  }, [selectedBlock]);

  //* 전체 YAML 생성
  //? 모든 블록을 포함한 완전한 워크플로우 YAML을 생성
  const getFullYaml = useCallback(() => {
    if (blocks && blocks.length > 0) {
      return generateFullYaml(blocks);
    }
    return "# 워크플로우를 구성하여 YAML을 확인하세요";
  }, [blocks]);

  //* ========================================
  //* 편집 관련 함수들
  //* ========================================

  //* YAML 편집 핸들러
  const handleYamlChange = useCallback((value: string) => {
    setEditableYaml(value);
  }, []);

  //* YAML 파싱 함수 (간단한 구현)
  const parseYamlToConfig = useCallback(
    (yaml: string): Record<string, unknown> => {
      const lines = yaml.split("\n");
      const config: Record<string, unknown> = {};
      let currentKey = "";
      let currentValue: Record<string, unknown> | unknown[] = {};

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) return;

        const match = trimmedLine.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (value) {
            config[key] = value;
          } else {
            currentKey = key;
            currentValue = {};
          }
        } else if (trimmedLine.startsWith("- ")) {
          // 배열 항목
          const item = trimmedLine.substring(2);
          if (!Array.isArray(currentValue)) {
            currentValue = [];
          }
          (currentValue as unknown[]).push(item);
          config[currentKey] = currentValue;
        } else if (trimmedLine.includes(":")) {
          // 중첩된 객체
          const [key, value] = trimmedLine.split(":").map((s) => s.trim());
          if (value) {
            if (!(currentValue as Record<string, unknown>)[key]) {
              (currentValue as Record<string, unknown>)[key] = {};
            }
            (currentValue as Record<string, unknown>)[key] = value;
          }
          config[currentKey] = currentValue;
        }
      });

      return config;
    },
    []
  );

  //* 편집된 YAML 저장 핸들러
  const handleSaveYaml = useCallback(async () => {
    if (!editableYaml.trim()) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      if (viewMode === "block" && selectedBlock && onBlockUpdate) {
        //* 단일 블록 업데이트
        const parsedConfig = parseYamlToConfig(editableYaml);
        const updatedBlock = {
          ...selectedBlock,
          config: parsedConfig,
        };
        onBlockUpdate(updatedBlock);
        setSaveStatus("success");

        //* 성공 메시지 표시
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("YAML 파싱 오류:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [editableYaml, viewMode, selectedBlock, onBlockUpdate, parseYamlToConfig]);

  //* ========================================
  //* 액션 함수들
  //* ========================================

  //* YAML을 클립보드에 복사
  //! 현재 뷰 모드에 따라 YAML을 클립보드에 복사
  const copyYaml = useCallback(() => {
    const yaml = viewMode === "block" ? getBlockYaml() : getFullYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      console.log("YAML이 클립보드에 복사되었습니다.");
    });
  }, [viewMode, getBlockYaml, getFullYaml]);

  //* 트리 뷰에서 블록 선택 핸들러
  const handleBlockSelect = useCallback(
    (block: ServerBlock) => {
      if (onBlockUpdate) {
        onBlockUpdate(block);
      }
    },
    [onBlockUpdate]
  );

  //* 뷰 모드 변경 핸들러
  const handleViewModeChange = useCallback(
    (mode: "block" | "full" | "tree") => {
      setViewMode(mode);
    },
    []
  );

  //* ========================================
  //* 렌더링
  //* ========================================

  return (
    <div className="w-[400px] h-full min-h-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* ========================================
          헤더 영역
          ======================================== */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 m-0">
          📄 YAML 미리보기
        </h3>

        {/* 뷰 모드 토글 버튼들 */}
        <div className="flex gap-1">
          <button
            onClick={() => handleViewModeChange("block")}
            className={`px-2 py-1 text-xs rounded cursor-pointer border-none ${
              viewMode === "block"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            블록
          </button>
          <button
            onClick={() => handleViewModeChange("full")}
            className={`px-2 py-1 text-xs rounded cursor-pointer border-none ${
              viewMode === "full"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleViewModeChange("tree")}
            className={`px-2 py-1 text-xs rounded cursor-pointer border-none ${
              viewMode === "tree"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            트리
          </button>
        </div>
      </div>

      {/* ========================================
          선택된 블록 정보 (블록 모드일 때만)
          ======================================== */}
      {viewMode === "block" && selectedBlock && (
        <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {selectedBlock.name}
          </div>
          <div className="text-xs text-gray-500">
            {selectedBlock.description}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            타입: {selectedBlock.type}
          </div>
        </div>
      )}

      {/* ========================================
          YAML 내용 표시 영역
          ======================================== */}
      <div className="flex-1 min-h-0 p-4 overflow-auto bg-gray-800 text-slate-50 font-mono text-xs leading-[1.5] h-full">
        {viewMode === "tree" ? (
          <div className="bg-white text-gray-900 rounded border h-full overflow-auto">
            {(() => {
              try {
                return (
                  <TreeView
                    structure={workflowStructure}
                    onBlockSelect={handleBlockSelect}
                    selectedBlock={selectedBlock}
                  />
                );
              } catch (error) {
                console.error("TreeView 렌더링 오류:", error);
                return (
                  <div className="p-4 text-center text-gray-500">
                    <div className="mb-2">트리 뷰를 불러올 수 없습니다.</div>
                    <button
                      onClick={() => handleViewModeChange("block")}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      블록 뷰로 전환
                    </button>
                  </div>
                );
              }
            })()}
          </div>
        ) : isEditing && viewMode === "block" && selectedBlock ? (
          <textarea
            value={editableYaml}
            onChange={(e) => handleYamlChange(e.target.value)}
            className="w-full h-full bg-gray-800 text-slate-50 font-mono text-xs leading-[1.5] border-none outline-none resize-none"
            placeholder="YAML을 편집하세요..."
          />
        ) : (
          <pre className="m-0 whitespace-pre-wrap break-words">
            {viewMode === "block" ? getBlockYaml() : getFullYaml()}
          </pre>
        )}
      </div>

      {/* ========================================
          블록 편집 영역 (블록 모드일 때만)
          ======================================== */}
      {viewMode === "block" && selectedBlock && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            블록 편집
          </div>

          {/* 블록 기본 정보 편집 */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                블록 이름
              </label>
              <input
                type="text"
                value={selectedBlock.name}
                onChange={(e) => {
                  if (onBlockUpdate) {
                    onBlockUpdate({
                      ...selectedBlock,
                      name: e.target.value,
                    });
                  }
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={selectedBlock.description || ""}
                onChange={(e) => {
                  if (onBlockUpdate) {
                    onBlockUpdate({
                      ...selectedBlock,
                      description: e.target.value,
                    });
                  }
                }}
                rows={2}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {selectedBlock.type === "step" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Job 이름
                </label>
                <input
                  type="text"
                  value={selectedBlock["job-name"] || ""}
                  onChange={(e) => {
                    if (onBlockUpdate) {
                      onBlockUpdate({
                        ...selectedBlock,
                        "job-name": e.target.value,
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: ci-pipeline"
                />
              </div>
            )}
          </div>

          {/* 블록 타입별 상세 편집 */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700">
              {selectedBlock.type === "trigger" && "트리거 설정"}
              {selectedBlock.type === "job" && "Job 설정"}
              {selectedBlock.type === "step" && "Step 설정"}
            </div>

            {/* 트리거 설정 */}
            {selectedBlock.type === "trigger" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    워크플로우 이름
                  </label>
                  <input
                    type="text"
                    value={(selectedBlock.config as any)?.name || ""}
                    onChange={(e) => {
                      if (onBlockUpdate) {
                        onBlockUpdate({
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            name: e.target.value,
                          },
                        });
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Job 설정 */}
            {selectedBlock.type === "job" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    실행 환경
                  </label>
                  <select
                    value={
                      (selectedBlock.config as any)?.jobs?.[
                        Object.keys(selectedBlock.config.jobs || {})[0]
                      ]?.["runs-on"] || "ubuntu-latest"
                    }
                    onChange={(e) => {
                      if (onBlockUpdate) {
                        const jobName = Object.keys(
                          selectedBlock.config.jobs || {}
                        )[0];
                        onBlockUpdate({
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            jobs: {
                              ...selectedBlock.config.jobs,
                              [jobName]: {
                                ...(selectedBlock.config.jobs as any)?.[
                                  jobName
                                ],
                                "runs-on": e.target.value,
                              },
                            },
                          },
                        });
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ubuntu-latest">ubuntu-latest</option>
                    <option value="ubuntu-22.04">ubuntu-22.04</option>
                    <option value="ubuntu-20.04">ubuntu-20.04</option>
                    <option value="windows-latest">windows-latest</option>
                    <option value="macos-latest">macos-latest</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 설정 */}
            {selectedBlock.type === "step" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Step 이름
                  </label>
                  <input
                    type="text"
                    value={(selectedBlock.config as any)?.name || ""}
                    onChange={(e) => {
                      if (onBlockUpdate) {
                        onBlockUpdate({
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            name: e.target.value,
                          },
                        });
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Action 사용
                  </label>
                  <input
                    type="text"
                    value={(selectedBlock.config as any)?.uses || ""}
                    onChange={(e) => {
                      if (onBlockUpdate) {
                        onBlockUpdate({
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            uses: e.target.value,
                          },
                        });
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: actions/checkout@v4"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    실행 명령
                  </label>
                  <textarea
                    value={(selectedBlock.config as any)?.run || ""}
                    onChange={(e) => {
                      if (onBlockUpdate) {
                        onBlockUpdate({
                          ...selectedBlock,
                          config: {
                            ...selectedBlock.config,
                            run: e.target.value,
                          },
                        });
                      }
                    }}
                    rows={3}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="실행할 명령어를 입력하세요"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          하단 액션 버튼들
          ======================================== */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        {/* 편집 모드일 때 저장 버튼 */}
        {isEditing && viewMode === "block" && selectedBlock && (
          <button
            onClick={handleSaveYaml}
            disabled={isSaving}
            className={`flex-1 px-3 py-2 text-xs border-none rounded cursor-pointer transition-all duration-200 ${
              saveStatus === "success"
                ? "bg-green-500 text-white"
                : saveStatus === "error"
                ? "bg-red-500 text-white"
                : isSaving
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {saveStatus === "success"
              ? "✅ 저장됨"
              : saveStatus === "error"
              ? "❌ 오류"
              : isSaving
              ? "⏳ 저장 중..."
              : "💾 저장"}
          </button>
        )}

        {/* 복사 버튼 */}
        <button
          onClick={copyYaml}
          className="flex-1 px-3 py-2 text-xs bg-emerald-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-emerald-600"
        >
          📋 복사
        </button>

        {/* 다운로드 버튼 */}
        <button
          onClick={() => {
            const yaml = viewMode === "block" ? getBlockYaml() : getFullYaml();
            const blob = new Blob([yaml], { type: "text/yaml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = viewMode === "block" ? "block.yaml" : "workflow.yaml";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white border-none rounded cursor-pointer transition-colors hover:bg-blue-700"
        >
          💾 다운로드
        </button>
      </div>
    </div>
  );
};
