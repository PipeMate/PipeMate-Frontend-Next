"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ServerBlock, WorkflowNodeData } from "../types";
import { useLayout } from "@/components/layout/LayoutContext";
import { DragDropSidebar } from "./DragDropSidebar";
import { AreaNode } from "./AreaNode";
import { AreaConnection } from "./AreaConnection";
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
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// 노드 타입 정의
export type NodeType = "workflowTrigger" | "job" | "step";

// 영역별 노드 데이터
export interface AreaNodeData {
  id: string;
  type: NodeType;
  data: WorkflowNodeData;
  order: number; // 영역 내 순서
  parentId?: string; // 부모 Job의 ID (Step의 경우)
  isSelected?: boolean;
  isEditing?: boolean;
}

// 연결 데이터
export interface ConnectionData {
  id: string;
  source: string;
  target: string;
  sourceType: NodeType;
  targetType: NodeType;
}

// 워크플로우 에디터 Props
export interface AreaBasedWorkflowEditorProps {
  onWorkflowChange?: (blocks: ServerBlock[]) => void;
  initialBlocks?: ServerBlock[];
  onNodeSelect?: (block: ServerBlock | undefined) => void;
  onEditModeToggle?: () => void;
  isEditing?: boolean;
}

// 영역별 노드 상태
interface AreaNodes {
  trigger: AreaNodeData[];
  job: AreaNodeData[];
  step: AreaNodeData[];
}

export const AreaBasedWorkflowEditor: React.FC<
  AreaBasedWorkflowEditorProps
> = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
  onEditModeToggle,
  isEditing,
}) => {
  const [areaNodes, setAreaNodes] = useState<AreaNodes>({
    trigger: [],
    job: [],
    step: [],
  });
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [selectedNode, setSelectedNode] = useState<AreaNodeData | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<ConnectionData | null>(null);
  const [draggedNode, setDraggedNode] = useState<AreaNodeData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<AreaNodeData | null>(null);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  const { setSidebarExtra } = useLayout();

  // 사이드바에 드래그 드롭 패널 설정
  useEffect(() => {
    setSidebarExtra(<DragDropSidebar />);
    return () => setSidebarExtra(null);
  }, [setSidebarExtra]);

  // Job 이름 자동 생성
  const generateJobName = useCallback((jobIndex: number) => {
    return `job-${jobIndex + 1}`;
  }, []);

  // 노드 생성 핸들러 (드롭 이벤트)
  const handleNodeCreate = useCallback(
    (nodeType: NodeType, nodeData: WorkflowNodeData, parentId?: string) => {
      // 트리거는 하나만 허용
      if (nodeType === "workflowTrigger" && areaNodes.trigger.length > 0) {
        return;
      }

      // Job인 경우 job-name 자동 생성
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

  // 드롭 이벤트 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent, targetArea: keyof AreaNodes) => {
      e.preventDefault();

      try {
        const data = e.dataTransfer.getData("application/reactflow");
        if (data) {
          const parsedData = JSON.parse(data);

          // 파이프라인 드롭 처리
          if (parsedData.type === "pipeline") {
            const blocks = parsedData.blocks;

            // 파이프라인의 job과 step들을 분리하여 처리
            const jobBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "job"
            );
            const stepBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "step"
            );
            const triggerBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "trigger"
            );

            // 1. 먼저 trigger 블록들 생성
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

            // 2. job 블록들 생성
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

            // 3. step 블록들을 해당 job에 연결하여 생성
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

              // step의 job-name에 해당하는 job을 찾아서 parentId 설정
              let parentId: string | undefined;
              if (block["job-name"]) {
                const targetJob = areaNodes.job.find(
                  (job) => job.data.jobName === block["job-name"]
                );
                if (targetJob) {
                  parentId = targetJob.id;
                }
              } else {
                // job-name이 없는 경우, 가장 최근에 생성된 job을 부모로 설정
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

          // 개별 블록 드롭 처리
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

          // Step을 Job 영역에 드롭한 경우, 가장 가까운 Job을 부모로 설정
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

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback(
    (node: AreaNodeData) => {
      setSelectedNode(node);
      setSelectedConnection(null);

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

  // 노드 드래그 시작
  const handleNodeDragStart = useCallback((node: AreaNodeData) => {
    setDraggedNode(node);
  }, []);

  // 노드 드래그 중
  const handleNodeDrag = useCallback(
    (e: React.DragEvent, node: AreaNodeData) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    []
  );

  // 노드 드롭 (영역 내 순서 변경 및 Job 간 이동)
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

        // Step의 경우 Job 간 이동 또는 순서 변경
        if (draggedNode.type === "step") {
          const currentSteps = [...prev.step];
          const draggedIndex = currentSteps.findIndex(
            (step) => step.id === draggedNode.id
          );

          if (draggedIndex !== -1) {
            const [draggedItem] = currentSteps.splice(draggedIndex, 1);

            // Job 간 이동인 경우
            if (targetParentId && draggedItem.parentId !== targetParentId) {
              // 새로운 Job의 job-name을 참조
              const targetJob = prev.job.find(
                (job) => job.id === targetParentId
              );
              if (targetJob) {
                draggedItem.data.jobName = targetJob.data.jobName || "";
              }
              draggedItem.parentId = targetParentId;
            }

            // 같은 Job 내에서 순서 변경 또는 Job 간 이동
            const parentSteps = currentSteps.filter(
              (step) =>
                step.parentId === (targetParentId || draggedItem.parentId) &&
                step.id !== draggedItem.id
            );
            const insertIndex = Math.min(targetOrder, parentSteps.length);
            parentSteps.splice(insertIndex, 0, draggedItem);

            // 순서 재정렬
            const updatedParentSteps = parentSteps.map((step, index) => ({
              ...step,
              order: index,
            }));

            // 전체 Step 배열 업데이트
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

  // 연결 시작
  const handleConnectionStart = useCallback((nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
  }, []);

  // 연결 종료
  const handleConnectionEnd = useCallback(
    (targetNodeId: string) => {
      if (!isConnecting || !connectionStart) return;

      const sourceNode = getAllNodes().find((n) => n.id === connectionStart);
      const targetNode = getAllNodes().find((n) => n.id === targetNodeId);

      if (!sourceNode || !targetNode) return;

      // 연결 규칙 검증
      if (isValidConnection(sourceNode.type, targetNode.type)) {
        const newConnection: ConnectionData = {
          id: `${connectionStart}-${targetNodeId}`,
          source: connectionStart,
          target: targetNodeId,
          sourceType: sourceNode.type,
          targetType: targetNode.type,
        };

        // 중복 연결 방지
        const existingConnection = connections.find(
          (c) => c.source === connectionStart && c.target === targetNodeId
        );

        if (!existingConnection) {
          setConnections((prev) => [...prev, newConnection]);
        }
      }

      setIsConnecting(false);
      setConnectionStart(null);
    },
    [isConnecting, connectionStart, connections]
  );

  // 모든 노드 가져오기
  const getAllNodes = useCallback(() => {
    return [...areaNodes.trigger, ...areaNodes.job, ...areaNodes.step];
  }, [areaNodes]);

  // 연결 규칙 검증
  const isValidConnection = useCallback(
    (sourceType: NodeType, targetType: NodeType) => {
      // Trigger → Job
      if (sourceType === "workflowTrigger" && targetType === "job") {
        return true;
      }
      // Job → Job (의존성)
      if (sourceType === "job" && targetType === "job") {
        return true;
      }
      // Step → Job
      if (sourceType === "step" && targetType === "job") {
        return true;
      }
      return false;
    },
    []
  );

  // 노드 삭제
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        // 삭제할 노드가 Job인지 확인
        const deletedJob = prev.job.find((job) => job.id === nodeId);

        // 각 영역에서 노드 찾아서 삭제
        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].filter(
            (n) => n.id !== nodeId
          );

          // Job 영역의 경우 순서 재정렬 및 job-name 업데이트
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
            // 다른 영역은 순서만 재정렬
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => ({
              ...node,
              order: index,
            }));
          }
        });

        // Job이 삭제된 경우 하위 Step들도 삭제하고, 남은 Job들의 하위 Step들의 job-name 업데이트
        if (deletedJob) {
          // 삭제된 Job의 하위 Step들 제거
          newAreaNodes.step = newAreaNodes.step.filter(
            (step) => step.parentId !== nodeId
          );

          // 남은 Job들의 하위 Step들의 job-name 업데이트
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

      setConnections((prev) =>
        prev.filter((c) => c.source !== nodeId && c.target !== nodeId)
      );

      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode, generateJobName]
  );

  // 연결선 삭제
  const handleConnectionDelete = useCallback(
    (connectionId: string) => {
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));

      if (selectedConnection?.id === connectionId) {
        setSelectedConnection(null);
      }
    },
    [selectedConnection]
  );

  // 노드 편집 시작
  const handleNodeEdit = useCallback((node: AreaNodeData) => {
    setEditingNode(node);
  }, []);

  // Job의 job-name 변경 시 하위 Step들의 job-name도 업데이트
  const updateStepJobNames = useCallback(
    (jobId: string, newJobName: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        // 해당 Job의 하위 Step들의 job-name 업데이트
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

  // 노드 편집 저장
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

          // Job의 job-name이 변경된 경우 하위 Step들도 업데이트
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

  // 노드 편집 취소
  const handleNodeEditCancel = useCallback(() => {
    setEditingNode(null);
  }, []);

  // 워크플로우 저장
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

  // areaNodes 변경 시 실시간으로 blocks 생성하여 onWorkflowChange 호출
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

  // 워크스페이스 초기화
  const handleClearWorkspace = useCallback(() => {
    setAreaNodes({
      trigger: [],
      job: [],
      step: [],
    });
    setConnections([]);
    setSelectedNode(null);
    setSelectedConnection(null);
  }, []);

  // 예제 워크플로우 추가
  const handleAddExampleWorkflow = useCallback(() => {
    const exampleNodes: AreaNodes = {
      trigger: [
        {
          id: "trigger-1",
          type: "workflowTrigger",
          data: {
            label: "워크플로우 기본 설정",
            type: "workflow_trigger",
            description:
              "GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.",
            config: {
              name: "Java CICD",
              on: {
                workflow_dispatch: {},
                push: { branches: ["v2"] },
              },
            },
          },
          order: 0,
        },
      ],
      job: [
        {
          id: "job-1",
          type: "job",
          data: {
            label: "Job 설정",
            type: "job",
            description:
              "사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.",
            jobName: "ci-pipeline",
            config: {
              jobs: {
                "ci-pipeline": {
                  "runs-on": "ubuntu-latest",
                },
              },
            },
          },
          order: 0,
        },
      ],
      step: [
        {
          id: "step-1",
          type: "step",
          data: {
            label: "Checkout repository",
            type: "step",
            description: "GitHub 저장소를 체크아웃하는 단계입니다.",
            jobName: "ci-pipeline",
            config: {
              name: "Checkout repository",
              uses: "actions/checkout@v4",
            },
          },
          order: 0,
          parentId: "job-1",
        },
        {
          id: "step-2",
          type: "step",
          data: {
            label: "Set up JDK 21",
            type: "step",
            description:
              "GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.",
            jobName: "ci-pipeline",
            config: {
              name: "Set up JDK 21",
              uses: "actions/setup-java@v4",
              with: {
                distribution: "adopt",
                "java-version": "21",
              },
            },
          },
          order: 1,
          parentId: "job-1",
        },
      ],
    };

    const exampleConnections: ConnectionData[] = [
      {
        id: "trigger-1-job-1",
        source: "trigger-1",
        target: "job-1",
        sourceType: "workflowTrigger",
        targetType: "job",
      },
    ];

    setAreaNodes(exampleNodes);
    setConnections(exampleConnections);
  }, []);

  // 편집 모드 상태를 노드에 반영
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

  // Job별 Step 그룹핑
  const getStepsByJob = useCallback(() => {
    const jobSteps: Record<string, AreaNodeData[]> = {};

    areaNodes.job.forEach((job) => {
      jobSteps[job.id] = areaNodes.step.filter(
        (step) => step.parentId === job.id
      );
    });

    return jobSteps;
  }, [areaNodes]);

  // 특정 Job에 Step을 드롭하는 핸들러
  const handleStepDropToJob = useCallback(
    (e: React.DragEvent, jobId: string, stepIndex?: number) => {
      e.preventDefault();
      e.stopPropagation(); // 이벤트 버블링 방지

      if (isProcessingDrop) return; // 이미 처리 중이면 무시
      setIsProcessingDrop(true);

      try {
        const data = e.dataTransfer.getData("application/reactflow");
        if (data) {
          const parsedData = JSON.parse(data);

          // Step 블록을 특정 Job에 드롭
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

            // 해당 Job의 job-name을 참조
            const targetJob = areaNodes.job.find((job) => job.id === jobId);
            if (targetJob) {
              nodeData.jobName = targetJob.data.jobName || "";
            }

            handleNodeCreate("step", nodeData, jobId);
          }
        }
      } catch (error) {
        console.error("Step 드롭 처리 오류:", error);
      } finally {
        setIsProcessingDrop(false);
      }
    },
    [areaNodes.job, handleNodeCreate, isProcessingDrop]
  );

  // Job 영역에 Step을 드롭할 때 가장 가까운 Job을 찾는 함수
  const findClosestJob = useCallback((dropY: number) => {
    const jobElements = document.querySelectorAll("[data-job-id]");
    let closestJob = null;
    let minDistance = Infinity;

    jobElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const jobCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(dropY - jobCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        closestJob = element.getAttribute("data-job-id");
      }
    });

    return closestJob;
  }, []);

  // 드롭 영역 렌더링
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
          areaKey === "trigger" ? "min-h-32" : "min-h-48"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          // 블록 라이브러리에서 드롭된 경우
          if (e.dataTransfer.types.includes("application/reactflow")) {
            if (!isFull) {
              // Job 영역에 Step을 드롭할 때 가장 가까운 Job을 찾아서 부모로 설정
              if (areaKey === "job") {
                try {
                  const data = e.dataTransfer.getData("application/reactflow");
                  if (data) {
                    const parsedData = JSON.parse(data);

                    // Step인 경우에만 findClosestJob 로직 사용
                    if (parsedData.type === "step") {
                      const closestJobId = findClosestJob(e.clientY);
                      if (closestJobId) {
                        // 기존 드롭 로직을 수정하여 특정 Job에 드롭
                        try {
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

                          // 해당 Job의 job-name을 참조
                          const targetJob = areaNodes.job.find(
                            (job) => job.id === closestJobId
                          );
                          if (targetJob) {
                            nodeData.jobName = targetJob.data.jobName || "";
                          }

                          handleNodeCreate("step", nodeData, closestJobId);
                          return; // 여기서 확실히 return
                        } catch (error) {
                          console.error("Step 드롭 처리 오류:", error);
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("드롭 데이터 파싱 오류:", error);
                }
              }
              // Job 영역이 아닌 경우 또는 Job 영역에 job을 드롭하는 경우 handleDrop 호출
              handleDrop(e, areaKey);
            }
          } else {
            // 영역 내 순서 변경
            handleNodeDrop(e, areaKey, nodes.length);
          }
        }}
      >
        <div className="text-sm font-semibold mb-3 text-gray-700">
          {title} {maxItems && `(${nodes.length}/${maxItems})`}
        </div>
        <div className="space-y-2">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              data-job-id={node.type === "job" ? node.id : undefined}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // 이벤트 버블링 방지
                handleStepDropToJob(e, node.id);
              }}
            >
              <AreaNode
                node={node}
                onSelect={handleNodeSelect}
                onDragStart={handleNodeDragStart}
                onDrag={handleNodeDrag}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
                isConnecting={isConnecting}
                connectionStart={connectionStart}
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
                    e.stopPropagation(); // 이벤트 버블링 방지
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
                          onConnectionStart={handleConnectionStart}
                          onConnectionEnd={handleConnectionEnd}
                          isConnecting={isConnecting}
                          connectionStart={connectionStart}
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
          {isFull && (
            <div className="text-red-400 text-sm text-center py-2">
              {title} 영역이 가득 찼습니다
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden w-full h-full">
      {/* 메인 에디터 영역 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden w-full h-full bg-slate-50">
        {/* 영역별 배치 */}
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto">
          {/* Trigger 영역 - 하나로 제한 */}
          {renderDropArea(
            "trigger",
            "워크플로우 트리거",
            "border-blue-300 bg-blue-50",
            1
          )}

          {/* Job 영역 - 여러 개 허용 */}
          {renderDropArea("job", "Job", "border-green-300 bg-green-50")}
        </div>

        {/* 연결선들 렌더링 */}
        {connections.map((connection) => (
          <AreaConnection
            key={connection.id}
            connection={connection}
            nodes={getAllNodes()}
            onSelect={() => setSelectedConnection(connection)}
            isSelected={selectedConnection?.id === connection.id}
          />
        ))}

        {/* 상단 컨트롤 패널 */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex gap-2 p-2 bg-white border border-gray-200 rounded shadow-sm flex-wrap">
            {/* 워크플로우 전체 액션 */}
            <button
              onClick={handleSaveWorkflow}
              className="px-3 py-1.5 text-xs bg-emerald-500 text-white border-none rounded font-semibold cursor-pointer transition-colors hover:bg-emerald-600 flex items-center gap-1"
            >
              <Save size={16} /> 저장
            </button>
            <button
              onClick={handleAddExampleWorkflow}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white border-none rounded cursor-pointer transition-colors hover:bg-blue-700 flex items-center gap-1"
            >
              <ClipboardList size={16} /> 예제 추가
            </button>
            <button
              onClick={handleClearWorkspace}
              className="px-3 py-1.5 text-xs bg-red-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-red-600 flex items-center gap-1"
            >
              <Trash2 size={16} /> 초기화
            </button>

            {/* 선택된 노드가 있을 때만 표시되는 액션들 */}
            {selectedNode && (
              <>
                <div className="w-px bg-gray-300 mx-2"></div>
                <div className="text-xs text-gray-500 font-medium px-2 py-1">
                  {selectedNode.data.label}
                </div>
                <button
                  onClick={() => handleNodeSelect(selectedNode)}
                  className="px-3 py-1.5 text-xs bg-blue-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-blue-600 flex items-center gap-1"
                  title="YAML 미리보기"
                >
                  <Eye size={16} /> 미리보기
                </button>
                <button
                  onClick={() => handleNodeEdit(selectedNode)}
                  className="px-3 py-1.5 text-xs bg-yellow-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-yellow-600 flex items-center gap-1"
                  title="노드 편집"
                >
                  <Edit size={16} /> 편집
                </button>
                <button
                  onClick={() => handleNodeDelete(selectedNode.id)}
                  className="px-3 py-1.5 text-xs bg-red-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-red-600 flex items-center gap-1"
                  title="노드 삭제"
                >
                  <X size={16} /> 삭제
                </button>
              </>
            )}

            {/* 선택된 연결선이 있을 때만 표시되는 액션들 */}
            {selectedConnection && (
              <>
                <div className="w-px bg-gray-300 mx-2"></div>
                <div className="text-xs text-gray-500 font-medium px-2 py-1">
                  연결선
                </div>
                <button
                  onClick={() => handleConnectionDelete(selectedConnection.id)}
                  className="px-3 py-1.5 text-xs bg-red-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-red-600 flex items-center gap-1"
                  title="선택된 연결선 삭제"
                >
                  <X size={16} /> 연결 삭제
                </button>
              </>
            )}
          </div>
        </div>

        {/* 하단 정보 패널 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-xs text-gray-500">
            <Lightbulb size={14} className="inline mr-1" /> <strong>팁:</strong>{" "}
            블록을 영역에 드래그하여 추가하고, Step을 Job 내부에 드롭하여
            연결하세요. <strong>연결 규칙:</strong> Trigger→Job, Job→Job,
            Step→Job만 허용됩니다.
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
