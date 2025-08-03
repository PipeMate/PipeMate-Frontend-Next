//* 인터랙티브 React Flow 워크스페이스 컴포넌트
//* GitHub Actions 워크플로우를 시각적으로 편집할 수 있는 메인 컴포넌트
"use client";

import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  NodeTypes,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/styles/reactflow.css";

import {
  ReactFlowWorkspaceProps,
  ServerBlock,
  WorkflowNodeData,
} from "../types";
import { WorkflowTriggerNode } from "./nodes/WorkflowTriggerNode";
import { JobNode } from "./nodes/JobNode";
import { StepNode } from "./nodes/StepNode";
import { useLayout } from "@/components/layout/LayoutContext";
import { DragDropSidebar } from "./DragDropSidebar";
// import { DragDropSidebar } from "./DragDropSidebar";
import {
  INITIAL_NODES,
  INITIAL_EDGES,
} from "../constants/reactFlowDefinitions";
import {
  convertNodesToServerBlocks,
  convertServerBlocksToNodes,
} from "../utils/dataConverter";
import {
  Save,
  ClipboardList,
  Trash2,
  Lightbulb,
  Edit,
  Eye,
  X,
  Layers,
} from "lucide-react";
import type { NodeChange, EdgeChange } from "@xyflow/react";

//* 커스텀 노드 타입 정의 - 각 노드 타입별 컴포넌트 매핑
const nodeTypes: NodeTypes = {
  workflowTrigger: WorkflowTriggerNode,
  job: JobNode,
  step: StepNode,
};

//* 노드 데이터 업데이트 Context - 노드 간 데이터 공유를 위한 Context API
type UpdateNodeDataFunction = (
  nodeId: string,
  newData: Record<string, unknown>
) => void;

type DeleteNodeFunction = (nodeId: string) => void;
const NodeUpdateContext = createContext<UpdateNodeDataFunction | null>(null);
const NodeDeleteContext = createContext<DeleteNodeFunction | null>(null);

//* Context 사용 훅 - 노드 컴포넌트에서 사용할 수 있는 커스텀 훅들
export const useNodeUpdate = () => {
  const updateNodeData = useContext(NodeUpdateContext);
  if (!updateNodeData) {
    throw new Error("useNodeUpdate must be used within ReactFlowWorkspace");
  }
  return updateNodeData;
};

export const useNodeDelete = () => {
  const deleteNode = useContext(NodeDeleteContext);
  if (!deleteNode) {
    throw new Error("useNodeDelete must be used within ReactFlowWorkspace");
  }
  return deleteNode;
};

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
//? SSR과 React Flow의 호환성 문제를 해결하기 위한 패턴
export const ReactFlowWorkspace = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
  onEditModeToggle,
  isEditing,
}: ReactFlowWorkspaceProps) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { setSidebarExtra } = useLayout();

  //* 초기 노드 설정 - 서버에서 받은 데이터가 있으면 사용, 없으면 기본값 사용
  const getInitialNodes = () => {
    if (initialBlocks && initialBlocks.length > 0) {
      const { nodes } = convertServerBlocksToNodes(initialBlocks);
      return nodes;
    }
    return INITIAL_NODES;
  };

  const getInitialEdges = () => {
    if (initialBlocks && initialBlocks.length > 0) {
      const { edges } = convertServerBlocksToNodes(initialBlocks);
      return edges;
    }
    return INITIAL_EDGES;
  };

  //* React Flow 상태 관리 - 노드와 엣지의 상태를 관리
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  //* 드롭 위치 계산 함수 - 마우스 위치를 React Flow 좌표로 변환
  const getDropPosition = useCallback(
    (event: React.DragEvent, reactFlowBounds: DOMRect) => {
      //* 스냅 그리드 적용 (15x15)
      const gridSize = 15;
      const x =
        Math.round((event.clientX - reactFlowBounds.left) / gridSize) *
        gridSize;
      const y =
        Math.round((event.clientY - reactFlowBounds.top) / gridSize) * gridSize;
      return { x, y };
    },
    []
  );

  //* 연결 규칙 검증 함수 - 간단한 드래그 앤 드롭 방식
  const isValidConnection = useCallback((source: Node, target: Node) => {
    //* Trigger → Job: 워크플로우 시작점
    if (source.type === "workflowTrigger" && target.type === "job") {
      return true;
    }
    //* Job → Job: 의존성 관계 (needs)
    if (source.type === "job" && target.type === "job") {
      return true;
    }
    //* Step → Job: Step을 Job에 직접 연결
    if (source.type === "step" && target.type === "job") {
      return true;
    }
    //* Job → Step: Job에서 Step으로 연결 (역방향)
    if (source.type === "job" && target.type === "step") {
      return true;
    }
    //* 그 외 모든 연결은 금지
    return false;
  }, []);

  //* Job 노드에 연결된 Step들을 업데이트하는 함수
  const updateJobConnectedSteps = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "job") {
          //* 해당 Job에 연결된 Step들 찾기
          const connectedSteps = edges
            .filter(
              (edge) => edge.target === node.id && edge.source !== node.id
            )
            .map((edge) => {
              const stepNode = nds.find((n) => n.id === edge.source);
              return stepNode;
            })
            .filter((step) => step && step.type === "step");

          return {
            ...node,
            data: {
              ...node.data,
              connectedSteps: connectedSteps,
            },
          };
        }
        return node;
      })
    );
  }, [edges]);

  //* 연결 방향 결정 함수 - 간단한 드래그 앤 드롭 방식
  const determineConnectionDirection = useCallback(
    (sourceNode: Node, targetNode: Node) => {
      //* Trigger와 Job의 경우: 항상 Trigger → Job 방향으로 강제
      if (
        (sourceNode.type === "workflowTrigger" && targetNode.type === "job") ||
        (sourceNode.type === "job" && targetNode.type === "workflowTrigger")
      ) {
        const triggerNode =
          sourceNode.type === "workflowTrigger" ? sourceNode : targetNode;
        const jobNode = sourceNode.type === "job" ? sourceNode : targetNode;
        return { source: triggerNode.id, target: jobNode.id };
      }

      //* Job 간 연결의 경우: 드래그 방향 유지
      if (sourceNode.type === "job" && targetNode.type === "job") {
        return { source: sourceNode.id, target: targetNode.id };
      }

      //* Step과 Job의 경우: Step → Job 방향으로 강제 (Step을 Job에 연결)
      if (
        (sourceNode.type === "step" && targetNode.type === "job") ||
        (sourceNode.type === "job" && targetNode.type === "step")
      ) {
        const stepNode = sourceNode.type === "step" ? sourceNode : targetNode;
        const jobNode = sourceNode.type === "job" ? sourceNode : targetNode;
        return { source: stepNode.id, target: jobNode.id };
      }

      //* 그 외의 경우: 연결 불가
      return null;
    },
    []
  );

  //* 클라이언트 사이드 마운트 확인 - SSR 문제 해결
  useEffect(() => {
    setIsClient(true);
  }, []);

  //* 사이드바에 드래그 앤 드롭 패널 설정 - 레이아웃과 연동
  useEffect(() => {
    setSidebarExtra(<DragDropSidebar />);
    return () => setSidebarExtra(null);
  }, [setSidebarExtra]);

  //* 엣지 연결 핸들러 - 연결 방향 결정 및 규칙 검증 후 연결 처리
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      //* 소스와 타겟 노드 찾기
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      //* 연결 방향 결정 (Trigger → Job 강제, Job → Job 드래그 방향 유지)
      const connectionDirection = determineConnectionDirection(
        sourceNode,
        targetNode
      );
      if (!connectionDirection) {
        alert(
          `연결할 수 없습니다!\n\n허용된 연결 규칙:\n• Trigger → Job\n• Job → Job (의존성)\n\n현재 시도: ${sourceNode.type} → ${targetNode.type}`
        );
        return;
      }

      //* 중복 연결 방지
      const existingEdge = edges.find(
        (edge) =>
          edge.source === connectionDirection.source &&
          edge.target === connectionDirection.target
      );
      if (existingEdge) {
        alert("이미 연결된 노드입니다!");
        return;
      }

      //* 연결 규칙에 맞으면 엣지 추가
      const newEdge: Edge = {
        id: `${connectionDirection.source}-${connectionDirection.target}`,
        source: connectionDirection.source,
        target: connectionDirection.target,
        type: "straight",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#64748b",
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      //* 연결된 노드 타입 확인
      const finalSourceNode = nodes.find(
        (n) => n.id === connectionDirection.source
      );
      const finalTargetNode = nodes.find(
        (n) => n.id === connectionDirection.target
      );

      //* Step을 Job에 연결한 경우 job-name 자동 설정
      if (finalSourceNode?.type === "step" && finalTargetNode?.type === "job") {
        const jobData = finalTargetNode.data as Record<string, unknown>;
        const jobName = (jobData.jobName as string) || "job1";

        //* Step의 job-name 업데이트
        setNodes((nds) =>
          nds.map((n) =>
            n.id === connectionDirection.source
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    jobName: jobName,
                  },
                }
              : n
          )
        );

        //* Job → Step 엣지 생성
        const jobToStepEdge: Edge = {
          id: `job-to-step-${connectionDirection.target}-${connectionDirection.source}`,
          source: connectionDirection.target,
          target: connectionDirection.source,
          type: "straight",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: "#64748b",
          },
          style: { zIndex: 10 },
        };
        setEdges((eds) => [...eds, jobToStepEdge]);

        console.log(`Step이 Job에 연결됨. job-name: ${jobName}`);
      }

      console.log(
        `연결 성공: ${finalSourceNode?.type} → ${finalTargetNode?.type}`
      );
    },
    [setEdges, nodes, edges, isValidConnection, determineConnectionDirection]
  );

  //* 엣지 제거 핸들러 - 사용자가 엣지를 삭제할 수 있도록
  const onEdgeDelete = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      console.log(`엣지 삭제: ${edgeId}`);
    },
    [setEdges]
  );

  //* 노드 데이터 업데이트 함수 - 개별 노드의 데이터를 수정
  const updateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) => {
        const updatedNodes = nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        );

        //* Job 노드의 job-name이 변경된 경우 연결된 Step들의 job-name도 업데이트
        if (newData.jobName) {
          const jobNode = updatedNodes.find((n) => n.id === nodeId);
          if (jobNode && jobNode.type === "job") {
            const newJobName = newData.jobName as string;

            //* 해당 Job에 직접 연결된 모든 Step들의 job-name 업데이트
            updatedNodes.forEach((stepNode) => {
              if (stepNode.type === "step") {
                const stepData = stepNode.data as Record<string, unknown>;
                if (stepData.jobName === jobNode.data.jobName) {
                  stepNode.data = {
                    ...stepData,
                    jobName: newJobName,
                  };
                }
              }
            });
          }
        }

        return updatedNodes;
      });
    },
    [setNodes]
  );

  //* 편집 모드 상태를 노드에 반영 - 선택된 노드만 편집 모드 활성화
  useEffect(() => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, isEditing } }
            : { ...node, data: { ...node.data, isEditing: false } }
        )
      );
    } else {
      //! 선택된 노드가 없으면 모든 노드의 편집 모드 해제
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { ...node.data, isEditing: false },
        }))
      );
    }
  }, [selectedNode, isEditing, setNodes]);

  //* 드래그 오버 핸들러 - 드롭 영역 설정
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  //* 드롭 핸들러 - 드롭 위치에 노드 생성 및 자동 엣지 생성 제거
  //! 사용자가 원하는 위치에 노드 생성하고 수동으로 연결하도록 개선
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = document
        .querySelector(".react-flow")
        ?.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/reactflow");
      if (data && reactFlowBounds) {
        try {
          const parsedData = JSON.parse(data as string);

          //* 드롭 위치 계산
          const dropPosition = getDropPosition(event, reactFlowBounds);

          //* 파이프라인 드롭 처리
          if (parsedData.type === "pipeline") {
            const pipeline = parsedData.pipeline;
            const blocks = parsedData.blocks;

            //* 고유 ID 생성 함수 - 중복 방지 (파이프라인용)
            const getUniqueId = (prefix: string) => {
              const existingIds = nodes.map((n) => n.id);
              const newIds = newNodes.map((n) => n.id);
              const allIds = [...existingIds, ...newIds];
              let counter = 1;
              let newId = `${prefix}-${counter}`;
              while (allIds.includes(newId)) {
                counter++;
                newId = `${prefix}-${counter}`;
              }
              return newId;
            };

            //* 고유 엣지 ID 생성 함수 - 중복 방지
            const getUniqueEdgeId = (
              source: string,
              target: string,
              type: string
            ) => {
              const existingEdgeIds = edges.map((e) => e.id);
              let counter = 1;
              let newEdgeId = `${type}-${source}-${target}-${counter}`;
              while (existingEdgeIds.includes(newEdgeId)) {
                counter++;
                newEdgeId = `${type}-${source}-${target}-${counter}`;
              }
              return newEdgeId;
            };

            //* 노드/엣지 추가용 임시 배열
            const newNodes: Node[] = [...nodes];
            const newEdges = [...edges];

            //* 파이프라인 내에서 생성된 노드들을 추적
            let currentJobId: string | null = null;

            //* 파이프라인의 모든 블록들을 순서대로 추가
            blocks.forEach((block: ServerBlock, index: number) => {
              if (block.type === "trigger") {
                //* 트리거 노드 추가 - 드롭 위치 기준으로 오프셋 적용
                const triggerCount = newNodes.filter(
                  (n) => n.type === "workflowTrigger"
                ).length;
                const triggerId = getUniqueId("trigger");
                const triggerNode: Node = {
                  id: triggerId,
                  type: "workflowTrigger",
                  position: {
                    x: dropPosition.x + triggerCount * 350,
                    y: dropPosition.y + triggerCount * 200,
                  },
                  data: {
                    label: block.name,
                    type: "workflow_trigger",
                    domain: block.domain,
                    task: block.task,
                    description: block.description,
                    config: block.config,
                  },
                };
                newNodes.push(triggerNode);
              } else if (block.type === "job") {
                //* Job 노드 추가 - 드롭 위치 기준으로 오프셋 적용
                const jobCount = newNodes.filter(
                  (n) => n.type === "job"
                ).length;
                const jobId = getUniqueId("job");

                //* 동적 Job 이름 생성 (job1, job2, job3...)
                const jobName = `job${jobCount + 1}`;

                //* config.jobs의 키를 job-name과 동일하게 설정
                const updatedConfig = {
                  ...block.config,
                  jobs: {
                    [jobName]: (block.config.jobs as Record<string, unknown>)?.[
                      Object.keys(block.config.jobs || {})[0]
                    ] || {
                      "runs-on": "ubuntu-latest",
                    },
                  },
                };

                const jobNode: Node = {
                  id: jobId,
                  type: "job",
                  position: {
                    x: dropPosition.x + jobCount * 350,
                    y: dropPosition.y + 200 + jobCount * 200,
                  },
                  draggable: true,
                  data: {
                    label: block.name,
                    type: "job",
                    domain: block.domain,
                    task: block.task,
                    description: block.description,
                    config: updatedConfig, //* 업데이트된 config 사용
                    jobName: jobName, //* 동적 job-name 설정
                    jobIndex: jobCount, //* Job 순서 추적
                  },
                };
                newNodes.push(jobNode);
                currentJobId = jobId;

                //* 자동 엣지 생성 제거 - 사용자가 수동으로 연결하도록 변경
                //* Job 간 의존성과 Trigger-Job 연결은 사용자가 직접 연결해야 함
              } else if (block.type === "step") {
                //* Step 추가: Job에 직접 연결
                if (!currentJobId) {
                  console.error("Job이 없습니다.");
                  return;
                }

                //* 현재 Job의 Step 개수
                const jobSteps = newNodes.filter(
                  (n) =>
                    n.type === "step" &&
                    n.data.jobName ===
                      `job${newNodes.filter((n) => n.type === "job").length}`
                );

                //* Step 노드 크기/간격 상수
                const STEP_WIDTH = 220;
                const STEP_HEIGHT = 56;
                const STEP_MARGIN = 56 + 56;

                //* Step position (Job 기준 상대좌표)
                const stepX = 50;
                const stepY =
                  100 + jobSteps.length * (STEP_HEIGHT + STEP_MARGIN);

                const stepId = getUniqueId("step");
                const stepNode: Node = {
                  id: stepId,
                  type: "step",
                  position: { x: stepX, y: stepY },
                  draggable: true,
                  data: {
                    label: block.name,
                    type: "step",
                    domain: block.domain,
                    task: block.task,
                    description: block.description,
                    config: {
                      ...block.config,
                    },
                    jobName: `job${
                      newNodes.filter((n) => n.type === "job").length
                    }`, //* 현재 Job의 이름으로 설정
                  },
                };
                newNodes.push(stepNode);

                //* Step 간 엣지 (순차 연결)
                if (jobSteps.length > 0) {
                  const prevStep = jobSteps[jobSteps.length - 1];
                  newEdges.push({
                    id: getUniqueEdgeId(prevStep.id, stepId, "step-to-step"),
                    source: prevStep.id,
                    target: stepId,
                    type: "straight",
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      width: 16,
                      height: 16,
                      color: "#64748b",
                    },
                    style: { zIndex: 10 },
                  });
                }
              }
            });

            setNodes(newNodes);
            setEdges(newEdges);

            //* Trigger 다음에 Job이 추가된 경우 자동 연결
            const triggerNodes = newNodes.filter(
              (n) => n.type === "workflowTrigger"
            );
            const jobNodes = newNodes.filter((n) => n.type === "job");

            if (triggerNodes.length > 0 && jobNodes.length > 0) {
              //* 가장 최근에 추가된 Trigger와 Job을 연결
              const latestTrigger = triggerNodes[triggerNodes.length - 1];
              const latestJob = jobNodes[jobNodes.length - 1];

              //* 이미 연결되어 있는지 확인
              const existingConnection = newEdges.find(
                (edge) =>
                  edge.source === latestTrigger.id &&
                  edge.target === latestJob.id
              );

              if (!existingConnection) {
                const autoEdge: Edge = {
                  id: `${latestTrigger.id}-${latestJob.id}`,
                  source: latestTrigger.id,
                  target: latestJob.id,
                  type: "straight",
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 16,
                    height: 16,
                    color: "#64748b",
                  },
                };
                setEdges((eds) => [...eds, autoEdge]);
                console.log(`자동 연결: Trigger → Job`);
              }
            }

            return;
          }

          //* 기존 블록 드롭 처리
          const block: ServerBlock = parsedData;
          //* 고유 ID 생성 함수 - 중복 방지
          const getUniqueId = (prefix: string) => {
            const existingIds = nodes.map((n) => n.id);
            let counter = 1;
            let newId = `${prefix}-${counter}`;
            while (existingIds.includes(newId)) {
              counter++;
              newId = `${prefix}-${counter}`;
            }
            return newId;
          };
          //* 노드/엣지 추가용 임시 배열
          const newNodes: Node[] = [...nodes];
          const newEdges = [...edges];
          if (block.type === "trigger") {
            //* Trigger 영역에 자동 배치 (Y: 0-200)
            const triggerId = getUniqueId("trigger");

            //* 기존 Trigger 노드들을 X 좌표 순으로 정렬
            const existingTriggers = newNodes.filter(
              (n) => n.type === "workflowTrigger"
            );
            const sortedTriggers = [...existingTriggers].sort(
              (a, b) => a.position.x - b.position.x
            );

            //* 새 Trigger 노드 위치 계산 (안전한 영역 내 배치)
            const triggerIndex = sortedTriggers.length;
            const triggerPosition = getSafeNodePosition(
              "workflowTrigger",
              triggerIndex
            );

            const triggerNode: Node = {
              id: triggerId,
              type: "workflowTrigger",
              position: triggerPosition,
              data: {
                label: block.name,
                type: "workflow_trigger",
                domain: block.domain,
                task: block.task,
                description: block.description,
                config: block.config,
              },
            };
            newNodes.push(triggerNode);
          } else if (block.type === "job") {
            //* Job 영역에 자동 배치 (Y: 200-400)
            const jobCount = newNodes.filter((n) => n.type === "job").length;
            const jobId = getUniqueId("job");

            //* 동적 Job 이름 생성 (job1, job2, job3...)
            const jobName = `job${jobCount + 1}`;

            //* config.jobs의 키를 job-name과 동일하게 설정
            const updatedConfig = {
              ...block.config,
              jobs: {
                [jobName]: (block.config.jobs as Record<string, unknown>)?.[
                  Object.keys(block.config.jobs || {})[0]
                ] || {
                  "runs-on": "ubuntu-latest",
                },
              },
            };

            //* 기존 Job 노드들을 X 좌표 순으로 정렬
            const existingJobs = newNodes.filter((n) => n.type === "job");
            const sortedJobs = [...existingJobs].sort(
              (a, b) => a.position.x - b.position.x
            );

            //* 새 Job 노드 위치 계산 (안전한 영역 내 배치)
            const jobIndex = sortedJobs.length;
            const jobPosition = getSafeNodePosition("job", jobIndex);

            const jobNode: Node = {
              id: jobId,
              type: "job",
              position: jobPosition,
              draggable: true,
              data: {
                label: block.name,
                type: "job",
                domain: block.domain,
                task: block.task,
                description: block.description,
                config: updatedConfig, //* 업데이트된 config 사용
                jobName: jobName, //* 동적 job-name 설정
                jobIndex: jobCount, //* Job 순서 추적
              },
            };
            newNodes.push(jobNode);
            //* 자동 엣지 생성 제거 - 사용자가 수동으로 연결하도록 변경
            //* Job 간 의존성과 Trigger-Job 연결은 사용자가 직접 연결해야 함

            //* Job 생성 후 job-name이 빈 Step들을 새 Job에 연결
            const jobConfig = jobNode.data.config as Record<string, unknown>;
            const jobs = jobConfig.jobs as Record<string, unknown> | undefined;
            const jobKeys = Object.keys(jobs || {});
            const newJobKey = jobKeys[0] || "ci-pipeline";

            //* 기존 Step들 중 job-name이 빈 것들을 새 Job에 연결
            newNodes.forEach((node) => {
              if (node.type === "step") {
                const nodeData = node.data as unknown as WorkflowNodeData;
                if (nodeData.jobName === "") {
                  //* Step의 job-name을 새 Job의 키로 업데이트
                  node.data = {
                    ...nodeData,
                    jobName: newJobKey,
                  };
                }
              }
            });
          } else if (block.type === "step") {
            //* Step 영역에 자동 배치 (Y: 400+)
            const allJobs = newNodes.filter((n) => n.type === "job");
            if (allJobs.length === 0) {
              alert("Job이 필요합니다. 먼저 Job 블록을 추가해주세요.");
              return;
            }

            //* 첫 번째 Job에 자동 연결 (가장 가까운 Job 대신)
            const targetJob = allJobs[0];
            const targetJobConfig = targetJob.data.config as Record<
              string,
              unknown
            >;
            const jobs = targetJobConfig.jobs as
              | Record<string, unknown>
              | undefined;
            const jobName = Object.keys(jobs || {})[0] || "default-job";

            //* 해당 Job의 Step 개수
            const jobSteps = newNodes.filter(
              (n) => n.type === "step" && n.data.jobName === jobName
            );

            //* 기존 Step 노드들을 X 좌표 순으로 정렬
            const existingSteps = newNodes.filter(
              (n) => n.type === "step" && n.data.jobName === jobName
            );
            const sortedSteps = [...existingSteps].sort(
              (a, b) => a.position.x - b.position.x
            );

            //* 새 Step 노드 위치 계산 (안전한 영역 내 배치)
            const stepIndex = sortedSteps.length;
            const stepPosition = getSafeNodePosition("step", stepIndex);

            const stepId = getUniqueId("step");
            const stepNode: Node = {
              id: stepId,
              type: "step",
              position: stepPosition,
              draggable: true,
              data: {
                label: block.name,
                type: "step",
                domain: block.domain,
                task: block.task,
                description: block.description,
                config: {
                  ...block.config,
                },
                jobName: jobName, //* 첫 번째 Job의 job-name과 일치시킴
              },
            };
            newNodes.push(stepNode);

            //* Job → Step 엣지 (첫 번째 Step인 경우)
            if (jobSteps.length === 0) {
              newEdges.push({
                id: `job-to-step-${targetJob.id}-${stepId}`,
                source: targetJob.id,
                target: stepId,
                type: "straight",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: "#64748b",
                },
                style: { zIndex: 10 },
              });
            } else {
              //* Step 간 엣지 (순차 연결)
              const prevStep = jobSteps[jobSteps.length - 1];
              newEdges.push({
                id: `step-to-step-${prevStep.id}-${stepId}`,
                source: prevStep.id,
                target: stepId,
                type: "straight",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: "#64748b",
                },
                style: { zIndex: 10 },
              });
            }
          }
          setNodes(newNodes);
          setEdges(newEdges);

          //* Trigger 다음에 Job이 추가된 경우 자동 연결
          const triggerNodes = newNodes.filter(
            (n) => n.type === "workflowTrigger"
          );
          const jobNodes = newNodes.filter((n) => n.type === "job");

          if (triggerNodes.length > 0 && jobNodes.length > 0) {
            //* 가장 최근에 추가된 Trigger와 Job을 연결
            const latestTrigger = triggerNodes[triggerNodes.length - 1];
            const latestJob = jobNodes[jobNodes.length - 1];

            //* 이미 연결되어 있는지 확인
            const existingConnection = newEdges.find(
              (edge) =>
                edge.source === latestTrigger.id && edge.target === latestJob.id
            );

            if (!existingConnection) {
              const autoEdge: Edge = {
                id: `${latestTrigger.id}-${latestJob.id}`,
                source: latestTrigger.id,
                target: latestJob.id,
                type: "straight",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: "#64748b",
                },
              };
              setEdges((eds) => [...eds, autoEdge]);
              console.log(`자동 연결: Trigger → Job`);
            }
          }

          //* React Flow의 fitView 기능이 자동으로 뷰포트를 조정함
        } catch (error) {
          console.error("드롭 처리 오류:", error);
        }
      }
    },
    [nodes, setNodes, setEdges, edges]
  );

  //* 동적 영역 계산 함수 - 화면 크기 기반으로 영역 크기 조정
  const getDynamicAreaBounds = useCallback(() => {
    const containerHeight = window.innerHeight;

    //* 화면 크기에 따라 영역 크기 조정
    const areaHeight = Math.max(200, containerHeight / 3);
    const safeMargin = 20;

    return {
      trigger: {
        minY: safeMargin,
        maxY: areaHeight - 80 - safeMargin,
        centerY: areaHeight / 2,
      },
      job: {
        minY: areaHeight + safeMargin,
        maxY: areaHeight * 2 - 80 - safeMargin,
        centerY: areaHeight * 1.5,
      },
      step: {
        minY: areaHeight * 2 + safeMargin,
        maxY: areaHeight * 3 - 80 - safeMargin,
        centerY: areaHeight * 2.5,
      },
    };
  }, []);

  //* 안전한 노드 위치 계산 함수 - 영역 내에서 안전하게 배치
  const getSafeNodePosition = useCallback(
    (nodeType: string, index: number) => {
      const NODE_WIDTH = 220;
      const NODE_MARGIN = 50;
      const areaBounds = getDynamicAreaBounds();

      //* 영역별 안전한 Y 좌표 계산
      const getAreaY = (type: string) => {
        switch (type) {
          case "workflowTrigger":
            return areaBounds.trigger.centerY;
          case "job":
            return areaBounds.job.centerY;
          case "step":
            return areaBounds.step.centerY;
          default:
            return areaBounds.job.centerY;
        }
      };

      return {
        x: 50 + index * (NODE_WIDTH + NODE_MARGIN),
        y: getAreaY(nodeType),
      };
    },
    [getDynamicAreaBounds]
  );

  //* 자동 뷰포트 조정 함수 - React Flow의 fitView 기능 사용
  const autoAdjustViewport = useCallback(() => {
    //* React Flow의 내장 fitView 기능을 사용하므로 별도 구현 불필요
    //* React Flow 컴포넌트의 fitView 옵션으로 처리
  }, []);

  //* 노드 자동 정렬 함수 - 각 영역 내에서 X 좌표 순으로 정렬
  const autoArrangeNodes = useCallback(
    (nodeType: string) => {
      setNodes((nds) => {
        const targetNodes = nds.filter((n) => n.type === nodeType);
        if (targetNodes.length <= 1) return nds;

        //* X 좌표 순으로 정렬
        const sortedNodes = [...targetNodes].sort(
          (a, b) => a.position.x - b.position.x
        );

        const updatedNodes = nds.map((node) => {
          if (node.type === nodeType) {
            const nodeIndex = sortedNodes.findIndex((n) => n.id === node.id);
            if (nodeIndex !== -1) {
              return {
                ...node,
                position: getSafeNodePosition(nodeType, nodeIndex),
              };
            }
          }
          return node;
        });

        return updatedNodes;
      });
    },
    [setNodes, getSafeNodePosition]
  );

  //* 드래그 상태 추적
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);

  //* 드래그 시작 핸들러
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
    setDragStartTime(Date.now());
  }, []);

  //* 드래그 종료 핸들러
  const onNodeDragStop = useCallback(() => {
    setIsDragging(false);
    setDragStartTime(null);
  }, []);

  //* 노드 위치 제한 함수 - 영역을 벗어나지 않도록 제한
  const constrainNodePosition = useCallback(
    (node: Node, newPosition: { x: number; y: number }) => {
      const NODE_HEIGHT = 80;
      const areaBounds = getDynamicAreaBounds();

      //* 노드 타입별 영역 제한
      const getAreaBounds = (nodeType: string) => {
        switch (nodeType) {
          case "workflowTrigger":
            return {
              minY: areaBounds.trigger.minY,
              maxY: areaBounds.trigger.maxY,
            };
          case "job":
            return {
              minY: areaBounds.job.minY,
              maxY: areaBounds.job.maxY,
            };
          case "step":
            return {
              minY: areaBounds.step.minY,
              maxY: areaBounds.step.maxY,
            };
          default:
            return { minY: 0, maxY: 800 };
        }
      };

      const bounds = getAreaBounds(node.type || "");
      const constrainedY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY, newPosition.y)
      );

      return {
        x: Math.max(0, Math.min(2000, newPosition.x)),
        y: constrainedY,
      };
    },
    [getDynamicAreaBounds]
  );

  //* 노드/엣지 변경 핸들러 - React Flow의 내장 변경 감지 및 위치 제한
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      //* 위치 변경 시 영역 제한 적용
      const constrainedChanges = changes.map((change) => {
        if (change.type === "position" && change.position) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            const constrainedPosition = constrainNodePosition(
              node,
              change.position
            );
            return {
              ...change,
              position: constrainedPosition,
            };
          }
        }
        return change;
      });

      onNodesChange(constrainedChanges);

      //* Step 노드 위치 변경 처리 - 드래그 완료 후에만 재정렬
      constrainedChanges.forEach((change) => {
        if (change.type === "position" && change.position && !isDragging) {
          const node = nodes.find((n) => n.id === change.id);
          if (node && node.type === "step") {
            //* 가장 가까운 Job 찾기
            const allJobs = nodes.filter((n) => n.type === "job");
            let closestJob = allJobs[0];
            let minDistance = Infinity;

            allJobs.forEach((job) => {
              const distance = Math.sqrt(
                Math.pow(change.position!.x - job.position.x, 2) +
                  Math.pow(change.position!.y - job.position.y, 2)
              );
              if (distance < minDistance) {
                minDistance = distance;
                closestJob = job;
              }
            });

            //* Job의 job-name 가져오기
            const jobConfig = closestJob.data.config as Record<string, unknown>;
            const jobs = jobConfig.jobs as Record<string, unknown> | undefined;
            const jobName = Object.keys(jobs || {})[0] || "default-job";

            //* Step의 job-name 업데이트
            setNodes((nds) =>
              nds.map((n) =>
                n.id === change.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        jobName: jobName,
                      },
                    }
                  : n
              )
            );

            //* 드래그 완료 후 Step 자동 정렬
            setTimeout(() => {
              autoArrangeNodes("step");
            }, 200);
          }
        }
      });
    },
    [
      onNodesChange,
      nodes,
      setNodes,
      setEdges,
      autoArrangeNodes,
      isDragging,
      constrainNodePosition,
    ]
  );
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  //* 노드 선택 핸들러 - 편집 모드와 연동
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  //* 엣지 선택 핸들러 - 엣지 클릭 시 선택 상태 관리
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null); // 노드 선택 해제
  }, []);

  //* 노드만 삭제 (하위 노드들은 독립적으로 만듦)
  //! 상위 노드 삭제 시 하위 노드들을 독립적으로 만드는 안전한 삭제 방식
  const deleteNodeOnly = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) {
        console.warn(`삭제할 노드를 찾을 수 없습니다: ${nodeId}`);
        return;
      }

      //* 삭제할 노드의 하위 노드들을 찾아서 독립적으로 만듦
      const childNodes = nodes.filter((n) => n.parentId === nodeId);

      setNodes((nds) => {
        const updatedNodes = nds.filter((n) => n.id !== nodeId);

        //* 하위 노드들을 독립적으로 만듦
        return updatedNodes.map((node) => {
          if (childNodes.some((child) => child.id === node.id)) {
            //* 절대 좌표로 변환 (부모 기준 상대좌표 + 부모 절대좌표)
            const absoluteX = nodeToDelete.position.x + (node.position.x ?? 0);
            const absoluteY = nodeToDelete.position.y + (node.position.y ?? 0);

            return {
              ...node,
              parentId: undefined, //* 부모 관계 제거
              position: {
                x: absoluteX,
                y: absoluteY,
              },
            };
          }
          return node;
        });
      });

      //* 관련된 엣지들 삭제 (삭제되는 노드와 직접 연결된 엣지만)
      setEdges((eds) =>
        eds.filter((e) => {
          //* 삭제되는 노드와 직접 연결된 엣지 제거
          if (e.source === nodeId || e.target === nodeId) {
            return false;
          }
          //* 하위 노드들 간의 연결은 유지
          return true;
        })
      );

      //* 선택된 노드가 삭제 대상이면 선택 해제
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }

      console.log(
        `노드 삭제 완료: ${nodeId}, 하위 노드 ${childNodes.length}개 독립화`
      );
    },
    [setNodes, setEdges, selectedNode, nodes]
  );

  //* 노드와 모든 하위 노드들을 재귀적으로 삭제
  //! 완전한 삭제 - 모든 하위 노드들을 포함하여 삭제
  const deleteNodeRecursive = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) {
        console.warn(`삭제할 노드를 찾을 수 없습니다: ${nodeId}`);
        return;
      }

      //* 삭제할 노드와 모든 하위 노드들의 ID를 수집 (순환 참조 방지)
      const nodesToDelete = new Set<string>();
      const visited = new Set<string>();

      const collectNodesToDelete = (targetId: string) => {
        if (visited.has(targetId)) {
          console.warn(`순환 참조 감지: ${targetId}`);
          return;
        }

        visited.add(targetId);
        nodesToDelete.add(targetId);

        //* parentId가 targetId인 모든 하위 노드들을 찾아서 재귀적으로 추가
        nodes.forEach((node) => {
          if (node.parentId === targetId) {
            collectNodesToDelete(node.id);
          }
        });
      };

      collectNodesToDelete(nodeId);

      //* 삭제할 노드들의 정보 로깅
      const nodesToDeleteArray = Array.from(nodesToDelete);
      console.log(`재귀 삭제 대상 노드들: ${nodesToDeleteArray.join(", ")}`);

      //* 노드들 삭제 및 Job 삭제 시 Step들의 job-name 갱신
      setNodes((nds) => {
        const remainingNodes = nds.filter((n) => !nodesToDelete.has(n.id));

        //* Job이 삭제된 경우, 해당 Job에 연결된 Step들의 job-name을 빈 문자열로 설정
        const updatedNodes = remainingNodes.map((node) => {
          if (node.type === "step") {
            const nodeData = node.data as unknown as WorkflowNodeData;
            const deletedJobIds = Array.from(nodesToDelete).filter((id) => {
              const deletedNode = nds.find((n) => n.id === id);
              return deletedNode?.type === "job";
            });

            //* Step의 부모 Job이 삭제된 경우 job-name을 빈 문자열로 설정
            if (
              deletedJobIds.some((jobId) => {
                const subflowNode = remainingNodes.find(
                  (n) => n.id === node.parentId
                );
                return subflowNode?.parentId === jobId;
              })
            ) {
              return {
                ...node,
                data: {
                  ...nodeData,
                  jobName: "",
                },
              };
            }
          }
          return node;
        });

        console.log(`삭제 후 남은 노드 수: ${updatedNodes.length}`);
        return updatedNodes;
      });

      //* 관련된 모든 엣지들 삭제
      setEdges((eds) => {
        const remainingEdges = eds.filter(
          (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)
        );
        console.log(`삭제 후 남은 엣지 수: ${remainingEdges.length}`);
        return remainingEdges;
      });

      //* 선택된 노드가 삭제 대상이면 선택 해제
      if (selectedNode && nodesToDelete.has(selectedNode.id)) {
        setSelectedNode(null);
        console.log("선택된 노드가 삭제되어 선택 해제됨");
      }

      console.log(
        `재귀 삭제 완료: ${nodeId}, 총 ${nodesToDeleteArray.length}개 노드 삭제`
      );
    },
    [setNodes, setEdges, selectedNode, nodes]
  );

  //* 워크스페이스 초기화 - 모든 노드와 엣지를 초기 상태로 리셋
  const clearWorkspace = useCallback(() => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNode(null);
    if (onWorkflowChange) {
      const blocks = convertNodesToServerBlocks(INITIAL_NODES);
      onWorkflowChange(blocks);
    }
  }, [setNodes, setEdges, onWorkflowChange]);

  //* 워크플로우 저장 함수 - 현재 상태를 서버 블록으로 변환하여 저장
  const saveWorkflow = useCallback(() => {
    const blocks = convertNodesToServerBlocks(nodes);
    console.log("저장된 워크플로우 데이터:", JSON.stringify(blocks, null, 2));
    alert("워크플로우가 저장되었습니다! 콘솔을 확인하세요.");
    onWorkflowChange(blocks);
  }, [nodes, onWorkflowChange]);

  //* 예제 워크플로우 추가 - 개발 및 테스트용 샘플 데이터
  const addExampleWorkflow = useCallback(() => {
    const exampleBlocks: ServerBlock[] = [
      {
        name: "워크플로우 기본 설정",
        type: "trigger",
        description:
          "GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.",
        config: {
          name: "Java CICD",
          on: {
            workflow_dispatch: {},
            push: {
              branches: ["v2"],
            },
          },
        },
      },
      {
        name: "Job 설정",
        type: "job",
        description: "사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.",
        config: {
          jobs: {
            "ci-pipeline": {
              "runs-on": "ubuntu-latest",
            },
          },
        },
      },
      {
        name: "Checkout repository",
        type: "step",
        "job-name": "ci-pipeline",
        description: "GitHub 저장소를 체크아웃하는 단계입니다.",
        config: {
          name: "Checkout repository",
          uses: "actions/checkout@v4",
        },
      },
      {
        name: "Set up JDK 21",
        type: "step",
        "job-name": "ci-pipeline",
        description:
          "GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.",
        config: {
          name: "Set up JDK 21",
          uses: "actions/setup-java@v4",
          with: {
            distribution: "adopt",
            "java-version": "21",
          },
        },
      },
      {
        name: "Gradle 빌드 블록",
        type: "step",
        "job-name": "ci-pipeline",
        description:
          "Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.",
        config: {
          name: "Gradle Build (no test)",
          run: "chmod +x ./gradlew\n./gradlew clean build -x test",
        },
      },
      {
        name: "Gradle 테스트 실행 블록",
        type: "step",
        "job-name": "ci-pipeline",
        description: "Gradle을 사용하여 테스트를 수행하는 블록입니다.",
        config: {
          name: "Test with Gradle",
          run: "./gradlew test",
        },
      },
      {
        name: "Docker 로그인",
        type: "step",
        "job-name": "ci-pipeline",
        description:
          "Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.",
        config: {
          name: "Docker Login",
          uses: "docker/login-action@v2.2.0",
          with: {
            username: "${{ secrets.DOCKER_USERNAME }}",
            password: "${{ secrets.DOCKER_PASSWORD }}",
          },
        },
      },
      {
        name: "Docker 이미지 빌드 및 푸시 블록",
        type: "step",
        "job-name": "ci-pipeline",
        description:
          "Docker 이미지를 빌드하고 Docker Hub에 푸시하는 단계입니다.",
        config: {
          name: "image build and push docker images",
          uses: "docker/build-push-action@v4.1.1",
          with: {
            context: ".",
            push: true,
            tags: "${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
            "no-cache": true,
          },
        },
      },
      {
        name: "Deploy to AWS EC2",
        type: "step",
        "job-name": "ci-pipeline",
        description: "AWS EC2에 배포하는 단계입니다.",
        config: {
          name: "Deploy to AWS EC2",
          run: "echo 'Deploying to AWS EC2'",
        },
      },
    ];

    const { nodes: exampleNodes, edges: exampleEdges } =
      convertServerBlocksToNodes(exampleBlocks);
    setNodes(exampleNodes);
    setEdges(exampleEdges);
  }, [setNodes, setEdges]);

  //* 노드 상태 검증 함수 - 데이터 무결성 보장
  //! 고아 노드와 잘못된 엣지를 자동으로 정리
  const validateNodeState = useCallback(() => {
    const orphanedNodes = nodes.filter(
      (node) => node.parentId && !nodes.find((n) => n.id === node.parentId)
    );

    if (orphanedNodes.length > 0) {
      console.warn(
        `고아 노드 발견: ${orphanedNodes.map((n) => n.id).join(", ")}`
      );
      //* 고아 노드들의 부모 관계 제거
      setNodes((nds) =>
        nds.map((node) =>
          orphanedNodes.some((orphan) => orphan.id === node.id)
            ? { ...node, parentId: undefined }
            : node
        )
      );
    }

    const invalidEdges = edges.filter(
      (edge) =>
        !nodes.find((n) => n.id === edge.source) ||
        !nodes.find((n) => n.id === edge.target)
    );

    if (invalidEdges.length > 0) {
      console.warn(
        `잘못된 엣지 발견: ${invalidEdges
          .map((e) => `${e.source}->${e.target}`)
          .join(", ")}`
      );
      //* 잘못된 엣지들 제거
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            nodes.find((n) => n.id === edge.source) &&
            nodes.find((n) => n.id === edge.target)
        )
      );
    }
  }, [nodes, edges, setNodes, setEdges]);

  //* Job의 연결된 Step들 초기 업데이트
  useEffect(() => {
    if (nodes.length > 0) {
      updateJobConnectedSteps();
    }
  }, [edges, updateJobConnectedSteps]);

  //* 워크플로우 변경 감지 및 콜백 호출 - 실시간 업데이트
  useEffect(() => {
    if (nodes.length > 0 && onWorkflowChange) {
      try {
        //* 노드 상태 검증
        validateNodeState();

        //* 노드를 서버 블록으로 변환
        const blocks = convertNodesToServerBlocks(nodes);
        onWorkflowChange(blocks);
      } catch (error) {
        console.error("워크플로우 생성 오류:", error);
      }
    }
  }, [nodes, edges, onWorkflowChange, validateNodeState]);

  //* onPaneClick: 노드가 아닌 곳 클릭 시 선택 해제
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    if (onNodeSelect) onNodeSelect(undefined);
  }, [onNodeSelect]);

  //* 클라이언트 사이드에서만 렌더링 - SSR 문제 해결
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-gray-500">
        React Flow 워크스페이스 로딩 중...
      </div>
    );
  }

  return (
    <NodeUpdateContext.Provider value={updateNodeData}>
      <NodeDeleteContext.Provider value={deleteNodeOnly}>
        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden w-full h-full">
          {/* React Flow 영역 */}
          <div
            className="flex-1 relative min-w-0 min-h-0 overflow-hidden w-full h-full"
            style={{ minHeight: "600px" }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
              attributionPosition="bottom-right"
              style={{ backgroundColor: "#f9fafb" }}
              snapToGrid={true}
              snapGrid={[15, 15]}
              multiSelectionKeyCode="Shift"
              deleteKeyCode="Delete"
              minZoom={0.3}
              maxZoom={2}
              zoomOnScroll={true}
              zoomOnPinch={true}
              panOnScroll={true}
              panOnDrag={true}
              //* 확대/축소 및 팬 동작을 예제와 동일하게 명시
              onPaneClick={handlePaneClick}
              //* 노드 이동 범위 제한 - 각 영역 내에서만 이동 가능
              nodeExtent={[
                [0, 0],
                [2000, 800],
              ]}
              //* 자동으로 모든 노드가 화면에 보이도록 조정
              fitView={true}
              fitViewOptions={{
                padding: 0.1,
                includeHiddenNodes: false,
                minZoom: 0.3,
                maxZoom: 1,
              }}
            >
              {/* 영역별 배경 분할 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                  zIndex: -1,
                }}
              >
                {/* Trigger 영역 */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "200px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderBottom: "2px solid rgba(59, 130, 246, 0.3)",
                  }}
                />
                {/* Job 영역 */}
                <div
                  style={{
                    position: "absolute",
                    top: "200px",
                    left: 0,
                    right: 0,
                    height: "200px",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    borderBottom: "2px solid rgba(34, 197, 94, 0.3)",
                  }}
                />
                {/* Step 영역 */}
                <div
                  style={{
                    position: "absolute",
                    top: "400px",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(249, 115, 22, 0.1)",
                    borderTop: "2px solid rgba(249, 115, 22, 0.3)",
                  }}
                />
              </div>
              <Background color="#e5e7eb" gap={20} />
              <Controls
                showZoom={true}
                showFitView={true}
                showInteractive={true}
                fitViewOptions={{ padding: 0.1, includeHiddenNodes: false }}
              />
              <MiniMap
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  pointerEvents: "auto",
                }}
                nodeColor="#3b82f6"
              />

              {/* 상단 컨트롤 패널 */}
              <Panel position="top-right">
                <div className="flex gap-2 p-2 bg-white border border-gray-200 rounded shadow-sm flex-wrap">
                  {/* 워크플로우 전체 액션 */}
                  <button
                    onClick={saveWorkflow}
                    className="px-3 py-1.5 text-xs bg-emerald-500 text-white border-none rounded font-semibold cursor-pointer transition-colors hover:bg-emerald-600 flex items-center gap-1"
                  >
                    <Save size={16} /> 저장
                  </button>
                  <button
                    onClick={addExampleWorkflow}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white border-none rounded cursor-pointer transition-colors hover:bg-blue-700 flex items-center gap-1"
                  >
                    <ClipboardList size={16} /> 예제 추가
                  </button>
                  <button
                    onClick={clearWorkspace}
                    className="px-3 py-1.5 text-xs bg-red-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={16} /> 초기화
                  </button>

                  {/* 선택된 노드가 있을 때만 표시되는 액션들 */}
                  {selectedNode && (
                    <>
                      <div className="w-px bg-gray-300 mx-2"></div>
                      <div className="text-xs text-gray-500 font-medium px-2 py-1">
                        {
                          (selectedNode.data as Record<string, unknown>)
                            .label as string
                        }
                      </div>
                      <button
                        onClick={() => {
                          const nodeData = selectedNode.data as Record<
                            string,
                            unknown
                          >;
                          if (onNodeSelect) {
                            const selectedBlock: ServerBlock = {
                              name: nodeData.label as string,
                              type:
                                nodeData.type === "workflow_trigger"
                                  ? "trigger"
                                  : (nodeData.type as
                                      | "trigger"
                                      | "job"
                                      | "step"),
                              description: nodeData.description as string,
                              "job-name": nodeData.jobName as
                                | string
                                | undefined,
                              config: nodeData.config as Record<
                                string,
                                unknown
                              >,
                            };
                            onNodeSelect(selectedBlock);
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-blue-600 flex items-center gap-1"
                        title="YAML 미리보기"
                      >
                        <Eye size={16} /> 미리보기
                      </button>
                      <button
                        onClick={() => {
                          const nodeData = selectedNode.data as Record<
                            string,
                            unknown
                          >;
                          if (onNodeSelect) {
                            const selectedBlock: ServerBlock = {
                              name: nodeData.label as string,
                              type:
                                nodeData.type === "workflow_trigger"
                                  ? "trigger"
                                  : (nodeData.type as
                                      | "trigger"
                                      | "job"
                                      | "step"),
                              description: nodeData.description as string,
                              "job-name": nodeData.jobName as
                                | string
                                | undefined,
                              config: nodeData.config as Record<
                                string,
                                unknown
                              >,
                            };
                            onNodeSelect(selectedBlock);
                            //* 편집 모드 활성화
                            if (onEditModeToggle) {
                              onEditModeToggle();
                            }
                          }
                        }}
                        className={`px-3 py-1.5 text-xs border-none rounded cursor-pointer transition-colors flex items-center gap-1 ${
                          isEditing
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"
                        }`}
                        title={isEditing ? "편집 모드 활성화됨" : "YAML 편집"}
                      >
                        <Edit size={16} /> {isEditing ? "편집 중" : "편집"}
                      </button>
                      <button
                        onClick={() => deleteNodeOnly(selectedNode.id)}
                        className="px-3 py-1.5 text-xs bg-orange-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-orange-600 flex items-center gap-1"
                        title="노드만 삭제 (하위 노드들은 독립적으로 유지)"
                      >
                        <X size={16} /> 노드만 삭제
                      </button>
                      <button
                        onClick={() => deleteNodeRecursive(selectedNode.id)}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-red-600 flex items-center gap-1"
                        title="노드와 모든 하위 노드 삭제"
                      >
                        <Layers size={16} /> 전체 삭제
                      </button>
                    </>
                  )}

                  {/* 선택된 엣지가 있을 때만 표시되는 액션들 */}
                  {selectedEdge && (
                    <>
                      <div className="w-px bg-gray-300 mx-2"></div>
                      <div className="text-xs text-gray-500 font-medium px-2 py-1">
                        연결선
                      </div>
                      <button
                        onClick={() => {
                          onEdgeDelete(selectedEdge);
                          setSelectedEdge(null);
                        }}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white border-none rounded cursor-pointer transition-colors hover:bg-red-600 flex items-center gap-1"
                        title="선택된 연결선 삭제"
                      >
                        <X size={16} /> 연결 삭제
                      </button>
                    </>
                  )}
                </div>
              </Panel>

              {/* 하단 정보 패널 */}
              <Panel position="bottom-center">
                <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-xs text-gray-500">
                  <Lightbulb size={14} className="inline mr-1" />{" "}
                  <strong>팁:</strong> 노드를 클릭하여 선택한 후, 우측 상단의
                  액션 버튼을 사용하세요.{" "}
                  <Save size={12} className="inline mx-1" /> 저장 버튼을 눌러
                  서버 데이터를 확인하세요. <strong>화면 조작:</strong> 마우스
                  휠로 확대/축소, 드래그로 이동, 우측 하단 컨트롤로 전체 보기.{" "}
                  <strong>연결:</strong> 노드의 핸들을 드래그하여 연결하세요
                  (Trigger→Job, Job→Job, Step→Job만 허용). Step을 Job에
                  드래그하면 자동으로 연결되고 job-name이 설정됩니다. Job
                  내부에서 Step 순서를 확인할 수 있습니다.
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </NodeDeleteContext.Provider>
    </NodeUpdateContext.Provider>
  );
};
