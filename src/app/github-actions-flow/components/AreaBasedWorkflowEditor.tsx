"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ServerBlock, WorkflowNodeData } from "../types";
import { useLayout } from "@/components/layout/LayoutContext";
import { DragDropSidebar } from "./DragDropSidebar";
import { AreaNode } from "./AreaNode";
import { NodeEditor } from "./NodeEditor";
import { convertNodesToServerBlocks } from "../utils/dataConverter";
import {
  Save,
  ClipboardList,
  Trash2,
  Lightbulb,
  Edit,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

/**
 * ========================================
 * 타입 정의
 * ========================================
 */

//* 노드 타입 정의
export type NodeType = "workflowTrigger" | "job" | "step";

//* 영역별 노드 데이터
export interface AreaNodeData {
  id: string;
  type: NodeType;
  data: WorkflowNodeData;
  order: number; //* 영역 내 순서
  parentId?: string; //* 부모 Job의 ID (Step의 경우)
  isSelected?: boolean;
  isEditing?: boolean;
}

//* 워크플로우 에디터 Props
export interface AreaBasedWorkflowEditorProps {
  onWorkflowChange?: (blocks: ServerBlock[]) => void;
  initialBlocks?: ServerBlock[];
  onNodeSelect?: (block: ServerBlock | undefined) => void;
  onEditModeToggle?: () => void;
  isEditing?: boolean;
}

//* 영역별 노드 상태
interface AreaNodes {
  trigger: AreaNodeData[];
  job: AreaNodeData[];
  step: AreaNodeData[];
}

/**
 * ========================================
 * 영역 기반 워크플로우 에디터 컴포넌트
 * ========================================
 *
 * 드래그 앤 드롭으로 블록을 추가하고, 영역별로 워크플로우를 구성하는 에디터입니다.
 * Trigger, Job, Step 영역으로 나누어져 있으며, 각 영역에 맞는 블록을 배치할 수 있습니다.
 */
export const AreaBasedWorkflowEditor: React.FC<
  AreaBasedWorkflowEditorProps
> = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
  onEditModeToggle,
  isEditing,
}) => {
  //* ========================================
  //* 상태 관리
  //* ========================================

  //* 영역별 노드 상태
  const [areaNodes, setAreaNodes] = useState<AreaNodes>({
    trigger: [],
    job: [],
    step: [],
  });

  //* 현재 선택된 노드
  const [selectedNode, setSelectedNode] = useState<AreaNodeData | null>(null);

  //* 드래그 중인 노드
  const [draggedNode, setDraggedNode] = useState<AreaNodeData | null>(null);

  //* 편집 중인 노드
  const [editingNode, setEditingNode] = useState<AreaNodeData | null>(null);

  //* 컨트롤 패널 열림/닫힘 상태
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

  //* 레이아웃 컨텍스트에서 사이드바 설정 함수 가져오기
  const { setSidebarExtra } = useLayout();

  //* ========================================
  //* 사이드바 설정
  //* ========================================

  //* 사이드바에 드래그 드롭 패널 설정
  useEffect(() => {
    setSidebarExtra(<DragDropSidebar />);
    return () => setSidebarExtra(null);
  }, [setSidebarExtra]);

  //* ========================================
  //* 유틸리티 함수
  //* ========================================

  /**
   * Job 이름 자동 생성
   * @param jobIndex Job 인덱스
   * @returns 생성된 Job 이름
   */
  const generateJobName = useCallback((jobIndex: number) => {
    return `job-${jobIndex + 1}`;
  }, []);

  //* ========================================
  //* 이벤트 핸들러
  //* ========================================

  /**
   * 노드 생성 핸들러 (드롭 이벤트)
   * 블록을 드롭했을 때 새로운 노드를 생성합니다.
   */
  const handleNodeCreate = useCallback(
    (nodeType: NodeType, nodeData: WorkflowNodeData, parentId?: string) => {
      //* 트리거는 하나만 허용
      if (nodeType === "workflowTrigger" && areaNodes.trigger.length > 0) {
        return;
      }

      //* Job인 경우 job-name 자동 생성
      if (nodeType === "job") {
        const jobIndex = areaNodes.job.length;
        const jobName = generateJobName(jobIndex);
        nodeData.jobName = jobName;
      }

      const newNode: AreaNodeData = {
        id: uuidv4(),
        type: nodeType,
        data: nodeData,
        order: 0,
        parentId,
        isSelected: false,
        isEditing: false,
      };

      setAreaNodes((prev) => {
        const areaKey =
          nodeType === "workflowTrigger"
            ? "trigger"
            : nodeType === "job"
            ? "job"
            : "step";
        const currentNodes = prev[areaKey];
        const newOrder = currentNodes.length;

        return {
          ...prev,
          [areaKey]: [...currentNodes, { ...newNode, order: newOrder }],
        };
      });
    },
    [areaNodes.job.length, areaNodes.trigger.length, generateJobName]
  );

  /**
   * 드롭 이벤트 핸들러
   * 블록을 특정 영역에 드롭했을 때 호출됩니다.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent, targetArea: keyof AreaNodes) => {
      e.preventDefault();

      try {
        const data = e.dataTransfer.getData("application/reactflow");
        if (data) {
          const parsedData = JSON.parse(data);

          //* 파이프라인 드롭 처리
          if (parsedData.type === "pipeline") {
            const blocks = parsedData.blocks;

            //* 파이프라인의 job과 step들을 분리하여 처리
            const jobBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "job"
            );
            const stepBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "step"
            );
            const triggerBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "trigger"
            );

            //* 1. 먼저 trigger 블록들 생성
            triggerBlocks.forEach((block: ServerBlock) => {
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "workflow_trigger",
                description: block.description,
                jobName: block["job-name"] || "",
                domain: block.domain,
                task: block.task,
                config: block.config,
              };
              handleNodeCreate("workflowTrigger", nodeData);
            });

            //* 2. job 블록들 생성
            jobBlocks.forEach((block: ServerBlock) => {
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "job",
                description: block.description,
                jobName: block["job-name"] || "",
                domain: block.domain,
                task: block.task,
                config: block.config,
              };
              handleNodeCreate("job", nodeData);
            });

            //* 3. step 블록들을 해당 job에 연결하여 생성
            stepBlocks.forEach((block: ServerBlock) => {
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "step",
                description: block.description,
                jobName: block["job-name"] || "",
                domain: block.domain,
                task: block.task,
                config: block.config,
              };

              //* step의 job-name에 해당하는 job을 찾아서 parentId 설정
              let parentId: string | undefined;
              if (block["job-name"]) {
                const targetJob = areaNodes.job.find(
                  (job) => job.data.jobName === block["job-name"]
                );
                if (targetJob) {
                  parentId = targetJob.id;
                }
              } else {
                //* job-name이 없는 경우, 가장 최근에 생성된 job을 부모로 설정
                const latestJob = areaNodes.job[areaNodes.job.length - 1];
                if (latestJob) {
                  parentId = latestJob.id;
                  nodeData.jobName = latestJob.data.jobName || "";
                }
              }

              handleNodeCreate("step", nodeData, parentId);
            });

            return;
          }

          //* 개별 블록 드롭 처리
          const block: ServerBlock = parsedData;
          const nodeType =
            block.type === "trigger"
              ? "workflowTrigger"
              : block.type === "job"
              ? "job"
              : "step";

          const nodeData: WorkflowNodeData = {
            label: block.name,
            type:
              block.type === "trigger"
                ? "workflow_trigger"
                : (block.type as "workflow_trigger" | "job" | "step"),
            description: block.description,
            jobName: block["job-name"] || "",
            domain: block.domain,
            task: block.task,
            config: block.config,
          };

          //* Step을 Job 영역에 드롭한 경우, 가장 가까운 Job을 부모로 설정
          let parentId: string | undefined;
          if (nodeType === "step" && targetArea === "job") {
            const jobNodes = areaNodes.job;
            if (jobNodes.length > 0) {
              const parentJob = jobNodes[jobNodes.length - 1];
              parentId = parentJob.id;
              nodeData.jobName = parentJob.data.jobName || "";
            }
          }

          handleNodeCreate(nodeType as NodeType, nodeData, parentId);
        }
      } catch (error) {
        console.error("드롭 처리 오류:", error);
      }
    },
    [handleNodeCreate, areaNodes.job]
  );

  /**
   * 노드 선택 핸들러
   * 사용자가 노드를 클릭했을 때 호출
   */
  const handleNodeSelect = useCallback(
    (node: AreaNodeData) => {
      setSelectedNode(node);

      if (onNodeSelect) {
        const selectedBlock: ServerBlock = {
          name: node.data.label,
          type:
            node.data.type === "workflow_trigger"
              ? "trigger"
              : (node.data.type as "trigger" | "job" | "step"),
          description: node.data.description,
          "job-name": node.data.jobName,
          config: node.data.config,
        };
        onNodeSelect(selectedBlock);
      }
    },
    [onNodeSelect]
  );

  /**
   * 노드 드래그 시작
   */
  const handleNodeDragStart = useCallback((node: AreaNodeData) => {
    setDraggedNode(node);
  }, []);

  /**
   * 노드 드래그 중
   */
  const handleNodeDrag = useCallback(
    (e: React.DragEvent, node: AreaNodeData) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    []
  );

  /**
   * 노드 드롭 (영역 내 순서 변경 및 Job 간 이동)
   */
  const handleNodeDrop = useCallback(
    (
      e: React.DragEvent,
      targetArea: keyof AreaNodes,
      targetOrder: number,
      targetParentId?: string
    ) => {
      e.preventDefault();

      if (!draggedNode) return;

      setAreaNodes((prev) => {
        const sourceArea =
          draggedNode.type === "workflowTrigger"
            ? "trigger"
            : draggedNode.type === "job"
            ? "job"
            : "step";

        //* Step의 경우 Job 간 이동 또는 순서 변경
        if (draggedNode.type === "step") {
          const currentSteps = [...prev.step];
          const draggedIndex = currentSteps.findIndex(
            (step) => step.id === draggedNode.id
          );

          if (draggedIndex !== -1) {
            const [draggedItem] = currentSteps.splice(draggedIndex, 1);

            //* Job 간 이동인 경우
            if (targetParentId && draggedItem.parentId !== targetParentId) {
              //* 새로운 Job의 job-name을 참조
              const targetJob = prev.job.find(
                (job) => job.id === targetParentId
              );
              if (targetJob) {
                draggedItem.data.jobName = targetJob.data.jobName || "";
              }
              draggedItem.parentId = targetParentId;
            }

            //* 같은 Job 내에서 순서 변경 또는 Job 간 이동
            const parentSteps = currentSteps.filter(
              (step) =>
                step.parentId === (targetParentId || draggedItem.parentId) &&
                step.id !== draggedItem.id
            );
            const insertIndex = Math.min(targetOrder, parentSteps.length);
            parentSteps.splice(insertIndex, 0, draggedItem);

            //* 순서 재정렬
            const updatedParentSteps = parentSteps.map((step, index) => ({
              ...step,
              order: index,
            }));

            //* 전체 Step 배열 업데이트
            const otherSteps = currentSteps.filter(
              (step) =>
                step.parentId !== (targetParentId || draggedItem.parentId)
            );
            const updatedSteps = [...otherSteps, ...updatedParentSteps];

            return {
              ...prev,
              step: updatedSteps,
            };
          }
        }

        return prev;
      });

      setDraggedNode(null);
    },
    [draggedNode, generateJobName]
  );

  /**
   * 모든 노드 가져오기
   */
  const getAllNodes = useCallback(() => {
    return [...areaNodes.trigger, ...areaNodes.job, ...areaNodes.step];
  }, [areaNodes]);

  /**
   * 노드 삭제
   */
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        //* 삭제할 노드가 Job인지 확인
        const deletedJob = prev.job.find((job) => job.id === nodeId);

        //* 각 영역에서 노드 찾아서 삭제
        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].filter(
            (n) => n.id !== nodeId
          );

          //* Job 영역의 경우 순서 재정렬 및 job-name 업데이트
          if (area === "job") {
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => ({
              ...node,
              order: index,
              data: {
                ...node.data,
                jobName: generateJobName(index),
              },
            }));
          } else {
            //* 다른 영역은 순서만 재정렬
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => ({
              ...node,
              order: index,
            }));
          }
        });

        //* Job이 삭제된 경우 하위 Step들도 삭제하고, 남은 Job들의 하위 Step들의 job-name 업데이트
        if (deletedJob) {
          //* 삭제된 Job의 하위 Step들 제거
          newAreaNodes.step = newAreaNodes.step.filter(
            (step) => step.parentId !== nodeId
          );

          //* 남은 Job들의 하위 Step들의 job-name 업데이트
          newAreaNodes.step = newAreaNodes.step.map((step) => {
            const parentJob = newAreaNodes.job.find(
              (job) => job.id === step.parentId
            );
            if (parentJob) {
              return {
                ...step,
                data: {
                  ...step.data,
                  jobName: parentJob.data.jobName,
                },
              };
            }
            return step;
          });
        }

        return newAreaNodes;
      });

      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode, generateJobName]
  );

  /**
   * 노드 편집 시작
   */
  const handleNodeEdit = useCallback((node: AreaNodeData) => {
    setEditingNode(node);
  }, []);

  /**
   * Job의 job-name 변경 시 하위 Step들의 job-name도 업데이트
   */
  const updateStepJobNames = useCallback(
    (jobId: string, newJobName: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        //* 해당 Job의 하위 Step들의 job-name 업데이트
        newAreaNodes.step = newAreaNodes.step.map((step) => {
          if (step.parentId === jobId) {
            return {
              ...step,
              data: {
                ...step.data,
                jobName: newJobName,
              },
            };
          }
          return step;
        });

        return newAreaNodes;
      });
    },
    []
  );

  /**
   * 노드 편집 저장
   */
  const handleNodeEditSave = useCallback(
    (updatedData: WorkflowNodeData) => {
      if (editingNode) {
        setAreaNodes((prev) => {
          const newAreaNodes = { ...prev };

          Object.keys(newAreaNodes).forEach((areaKey) => {
            const area = areaKey as keyof AreaNodes;
            newAreaNodes[area] = newAreaNodes[area].map((node) =>
              node.id === editingNode.id ? { ...node, data: updatedData } : node
            );
          });

          //* Job의 job-name이 변경된 경우 하위 Step들도 업데이트
          if (
            editingNode.type === "job" &&
            updatedData.jobName !== editingNode.data.jobName &&
            updatedData.jobName
          ) {
            updateStepJobNames(editingNode.id, updatedData.jobName);
          }

          return newAreaNodes;
        });

        setEditingNode(null);
      }
    },
    [editingNode, updateStepJobNames]
  );

  /**
   * 노드 편집 취소
   */
  const handleNodeEditCancel = useCallback(() => {
    setEditingNode(null);
  }, []);

  /**
   * 워크플로우 저장
   */
  const handleSaveWorkflow = useCallback(() => {
    if (onWorkflowChange) {
      const allNodes = getAllNodes();
      const blocks = convertNodesToServerBlocks(
        allNodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: { x: 0, y: 0 },
          data: n.data as unknown as Record<string, unknown>,
        }))
      );
      onWorkflowChange(blocks);
    }
  }, [getAllNodes, onWorkflowChange]);

  /**
   * 워크스페이스 초기화
   */
  const handleClearWorkspace = useCallback(() => {
    setAreaNodes({
      trigger: [],
      job: [],
      step: [],
    });
    setSelectedNode(null);
  }, []);

  //* ========================================
  //* 사이드 이펙트
  //* ========================================

  //* areaNodes 변경 시 실시간으로 blocks 생성하여 onWorkflowChange 호출
  useEffect(() => {
    if (onWorkflowChange) {
      const allNodes = getAllNodes();

      const blocks = convertNodesToServerBlocks(
        allNodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: { x: 0, y: 0 },
          data: n.data as unknown as Record<string, unknown>,
        }))
      );
      onWorkflowChange(blocks);
    }
  }, [areaNodes, onWorkflowChange, getAllNodes]);

  //* 편집 모드 상태를 노드에 반영
  useEffect(() => {
    if (selectedNode) {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].map((node) =>
            node.id === selectedNode.id
              ? { ...node, isEditing }
              : { ...node, isEditing: false }
          );
        });

        return newAreaNodes;
      });
    } else {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].map((node) => ({
            ...node,
            isEditing: false,
          }));
        });

        return newAreaNodes;
      });
    }
  }, [selectedNode, isEditing]);

  //* ========================================
  //* 유틸리티 함수
  //* ========================================

  /**
   * Job별 Step 그룹핑
   */
  const getStepsByJob = useCallback(() => {
    const jobSteps: Record<string, AreaNodeData[]> = {};

    areaNodes.job.forEach((job) => {
      jobSteps[job.id] = areaNodes.step.filter(
        (step) => step.parentId === job.id
      );
    });

    return jobSteps;
  }, [areaNodes]);

  /**
   * 특정 Job에 Step을 드롭하는 핸들러
   */
  const handleStepDropToJob = useCallback(
    (e: React.DragEvent, jobId: string, stepIndex?: number) => {
      e.preventDefault();
      e.stopPropagation(); //* 이벤트 버블링 방지

      try {
        const data = e.dataTransfer.getData("application/reactflow");
        if (data) {
          const parsedData = JSON.parse(data);

          //* Step 블록을 특정 Job에 드롭
          if (parsedData.type === "step") {
            const block: ServerBlock = parsedData;
            const nodeData: WorkflowNodeData = {
              label: block.name,
              type: "step",
              description: block.description,
              jobName: block["job-name"] || "",
              domain: block.domain,
              task: block.task,
              config: block.config,
            };

            //* 해당 Job의 job-name을 참조
            const targetJob = areaNodes.job.find((job) => job.id === jobId);
            if (targetJob) {
              nodeData.jobName = targetJob.data.jobName || "";
            }

            handleNodeCreate("step", nodeData, jobId);
          }
        }
      } catch (error) {
        console.error("Step 드롭 처리 오류:", error);
      }
    },
    [areaNodes.job, handleNodeCreate]
  );

  //* ========================================
  //* 렌더링 함수
  //* ========================================

  /**
   * 드롭 영역 렌더링
   */
  const renderDropArea = (
    areaKey: keyof AreaNodes,
    title: string,
    color: string,
    maxItems?: number
  ) => {
    const nodes = areaNodes[areaKey];
    const isFull = maxItems ? nodes.length >= maxItems : false;

    return (
      <div
        className={`flex-1 border-2 border-dashed ${color} rounded-lg p-4 ${
          areaKey === "trigger" ? "max-h-fit" : "min-h-48"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          //* 블록 라이브러리에서 드롭된 경우
          if (e.dataTransfer.types.includes("application/reactflow")) {
            if (!isFull) {
              handleDrop(e, areaKey);
            }
          } else {
            //* 영역 내 순서 변경
            handleNodeDrop(e, areaKey, nodes.length);
          }
        }}
      >
        <div className="text-sm font-semibold mb-3 text-gray-700">
          {title}{" "}
          {maxItems && (
            <span className={nodes.length >= maxItems ? "text-red-500" : ""}>
              ({nodes.length}/{maxItems})
            </span>
          )}
        </div>
        <div className="space-y-2">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              data-job-id={node.type === "job" ? node.id : undefined}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); //* 이벤트 버블링 방지
                handleStepDropToJob(e, node.id);
              }}
            >
              <AreaNode
                node={node}
                onSelect={handleNodeSelect}
                onDragStart={handleNodeDragStart}
                onDrag={handleNodeDrag}
              />

              {/* Job 내부에 Step 영역 표시 */}
              {node.type === "job" && (
                <div
                  className="ml-6 mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  style={{
                    minHeight: `${Math.max(
                      120,
                      (getStepsByJob()[node.id]?.length || 0) * 60 + 60
                    )}px`,
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); //* 이벤트 버블링 방지
                    handleStepDropToJob(e, node.id);
                  }}
                >
                  <div className="text-xs font-semibold text-orange-700 mb-2">
                    Steps ({getStepsByJob()[node.id]?.length || 0}) -{" "}
                    {node.data.jobName}
                  </div>
                  <div className="space-y-2">
                    {getStepsByJob()[node.id]?.map((step, stepIndex) => (
                      <div
                        key={step.id}
                        className="ml-4"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) =>
                          handleNodeDrop(e, "step", stepIndex, node.id)
                        }
                      >
                        <AreaNode
                          node={step}
                          onSelect={handleNodeSelect}
                          onDragStart={handleNodeDragStart}
                          onDrag={handleNodeDrag}
                        />
                      </div>
                    ))}
                    {(!getStepsByJob()[node.id] ||
                      getStepsByJob()[node.id].length === 0) && (
                      <div className="text-xs text-orange-500 text-center py-2">
                        Step을 여기에 드롭하세요
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {nodes.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-8">
              여기에 {title}를 드롭하세요
            </div>
          )}
        </div>
      </div>
    );
  };

  //* ========================================
  //* 메인 렌더링
  //* ========================================

  return (
    <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden w-full h-full">
      {/* 메인 에디터 영역 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden w-full h-full bg-slate-50 relative">
        {/* 영역별 배치 */}
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto">
          {/* Trigger 영역 - 하나로 제한 */}
          {renderDropArea(
            "trigger",
            "Trigger",
            "border-blue-300 bg-blue-50",
            1
          )}

          {/* Job 영역 - 여러 개 허용 */}
          {renderDropArea("job", "Job", "border-green-300 bg-green-50")}
        </div>

        {/* 플로팅 액션 버튼 (FAB) - 노드가 있을 때만 표시 */}
        {getAllNodes().length > 0 && (
          <div className="absolute bottom-6 right-6 z-20">
            <button
              onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            >
              {isControlPanelOpen ? <X size={24} /> : <Save size={24} />}
            </button>
          </div>
        )}

        {/* 바텀 시트 스타일 컨트롤 패널 */}
        {getAllNodes().length > 0 && isControlPanelOpen && (
          <>
            {/* 배경 오버레이 */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsControlPanelOpen(false)}
            />

            {/* 바텀 시트 */}
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out">
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* 패널 내용 */}
              <div className="px-6 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    워크플로우 컨트롤
                  </h3>
                  <button
                    onClick={() => setIsControlPanelOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 워크플로우 전체 액션 */}
                <div className="space-y-3 mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    워크플로우 액션
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSaveWorkflow}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium transition-colors hover:bg-emerald-600"
                    >
                      <Save size={18} />
                      저장
                    </button>
                    <button
                      onClick={handleClearWorkspace}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium transition-colors hover:bg-red-600"
                    >
                      <Trash2 size={18} />
                      초기화
                    </button>
                  </div>
                </div>

                {/* 선택된 노드 액션들 */}
                {selectedNode && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      선택된 노드: {selectedNode.data.label}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleNodeSelect(selectedNode)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-3 bg-blue-500 text-white rounded-xl font-medium transition-colors hover:bg-blue-600"
                        title="YAML 미리보기"
                      >
                        <Eye size={18} />
                        <span className="text-xs">미리보기</span>
                      </button>
                      <button
                        onClick={() => handleNodeEdit(selectedNode)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-3 bg-yellow-500 text-white rounded-xl font-medium transition-colors hover:bg-yellow-600"
                        title="노드 편집"
                      >
                        <Edit size={18} />
                        <span className="text-xs">편집</span>
                      </button>
                      <button
                        onClick={() => handleNodeDelete(selectedNode.id)}
                        className="flex flex-col items-center justify-center gap-1 px-3 py-3 bg-red-500 text-white rounded-xl font-medium transition-colors hover:bg-red-600"
                        title="노드 삭제"
                      >
                        <X size={18} />
                        <span className="text-xs">삭제</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 노드가 선택되지 않았을 때 안내 */}
                {!selectedNode && (
                  <div className="text-center py-6 text-gray-500">
                    <div className="text-sm">
                      노드를 선택하면 추가 액션을 사용할 수 있습니다
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 하단 정보 패널 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-xs text-gray-500">
            <Lightbulb size={14} className="inline mr-1" /> <strong>팁:</strong>{" "}
            블록을 영역에 드래그하여 추가하고, Step을 Job 내부에 드롭하여
            연결하세요.
          </div>
        </div>

        {/* 노드 편집 모달 */}
        {editingNode && (
          <NodeEditor
            nodeData={editingNode.data}
            nodeType={editingNode.type}
            onSave={handleNodeEditSave}
            onCancel={handleNodeEditCancel}
          />
        )}
      </div>
    </div>
  );
};
