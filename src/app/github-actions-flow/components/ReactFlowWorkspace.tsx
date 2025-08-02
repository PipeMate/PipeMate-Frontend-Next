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
  Connection,
  NodeTypes,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
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
import { SubFlowNode } from "./nodes/SubFlowNode";
import type { NodeChange, EdgeChange } from "@xyflow/react";

//* 커스텀 노드 타입 정의 - 각 노드 타입별 컴포넌트 매핑
const nodeTypes: NodeTypes = {
  workflowTrigger: WorkflowTriggerNode,
  job: JobNode,
  step: StepNode,
  subflow: SubFlowNode,
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

  //* 클라이언트 사이드 마운트 확인 - SSR 문제 해결
  useEffect(() => {
    setIsClient(true);
  }, []);

  //* 사이드바에 드래그 앤 드롭 패널 설정 - 레이아웃과 연동
  useEffect(() => {
    setSidebarExtra(<DragDropSidebar />);
    return () => setSidebarExtra(null);
  }, [setSidebarExtra]);

  //* 엣지 연결 핸들러 - 노드 간 연결을 처리
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: "straight" }, eds));
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
            const subflowNode = updatedNodes.find(
              (n) => n.type === "subflow" && n.parentId === nodeId
            );

            if (subflowNode) {
              //* 해당 Job의 subflow에 연결된 모든 Step들의 job-name 업데이트
              updatedNodes.forEach((stepNode) => {
                if (
                  stepNode.type === "step" &&
                  stepNode.parentId === subflowNode.id
                ) {
                  const stepData = stepNode.data as unknown as WorkflowNodeData;
                  stepNode.data = {
                    ...stepData,
                    jobName: newJobName,
                  };
                }
              });
            }
          }
        }

        return updatedNodes;
      });
    },
    [setNodes]
  );

  //* 서브플로우 노드와 관련 Step 노드들을 처리하는 헬퍼 함수
  //! Job 노드 삭제 시 서브플로우와 Step 노드들을 적절히 처리
  const handleSubflowNodes = useCallback(
    (jobNodeId: string, action: "delete" | "independent") => {
      const subflowNode = nodes.find(
        (n) => n.type === "subflow" && n.parentId === jobNodeId
      );

      if (!subflowNode) {
        console.log(`Job ${jobNodeId}에 연결된 서브플로우가 없습니다.`);
        return [];
      }

      const stepNodes = nodes.filter(
        (n) => n.type === "step" && n.parentId === subflowNode.id
      );

      console.log(
        `서브플로우 처리: ${subflowNode.id}, Step 노드 ${stepNodes.length}개`
      );

      if (action === "delete") {
        //* 서브플로우와 모든 Step 노드들을 삭제 대상에 추가
        return [subflowNode.id, ...stepNodes.map((n) => n.id)];
      } else {
        //* 서브플로우와 Step 노드들을 독립적으로 만듦
        setNodes((nds) =>
          nds.map((node) => {
            if (
              node.id === subflowNode.id ||
              stepNodes.some((s) => s.id === node.id)
            ) {
              return {
                ...node,
                parentId: undefined,
                position: {
                  x: node.position.x ?? 0,
                  y: node.position.y ?? 0,
                },
              };
            }
            return node;
          })
        );
        return [];
      }
    },
    [nodes, setNodes]
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

  //* 드롭 핸들러 - 블록 또는 파이프라인을 워크스페이스에 추가
  //! 가장 복잡한 로직 - 블록 타입별로 다른 처리 방식
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
            let currentSubflowId: string | null = null;

            //* 파이프라인의 모든 블록들을 순서대로 추가
            blocks.forEach((block: ServerBlock, index: number) => {
              if (block.type === "trigger") {
                //* 트리거 노드 추가 - 워크플로우의 시작점
                const triggerCount = newNodes.filter(
                  (n) => n.type === "workflowTrigger"
                ).length;
                const triggerId = getUniqueId("trigger");
                const triggerNode: Node = {
                  id: triggerId,
                  type: "workflowTrigger",
                  position: { x: 200 + triggerCount * 350, y: 50 },
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
                //* Job 노드 추가 - 워크플로우의 실행 단위 (여러 Job 지원)
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
                  position: { x: 200 + jobCount * 350, y: 250 },
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

                //* 서브플로우 노드 추가 (Job마다 1:1) - Step들을 담는 컨테이너
                const subflowId = getUniqueId("subflow");
                const SUBFLOW_WIDTH = 320;
                const SUBFLOW_HEIGHT = 180;
                const subflowNode: Node = {
                  id: subflowId,
                  type: "subflow",
                  position: { x: 0, y: 180 }, //* 부모(Job) 기준 바로 아래 일직선
                  parentId: jobId,
                  data: {
                    label: `${block.name} - Subflow`,
                    type: "subflow",
                    jobId,
                    stepCount: 0,
                    width: SUBFLOW_WIDTH,
                    height: SUBFLOW_HEIGHT,
                  },
                  style: { minWidth: SUBFLOW_WIDTH, minHeight: SUBFLOW_HEIGHT },
                };
                newNodes.push(subflowNode);
                currentSubflowId = subflowId;

                //* 엣지: Job → Subflow
                newEdges.push({
                  id: getUniqueEdgeId(jobId, subflowId, "job-to-subflow"),
                  source: jobId,
                  target: subflowId,
                  type: "straight",
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 16,
                    height: 16,
                    color: "#64748b",
                  },
                });

                //* Job 간 의존성 설정
                const existingJobs = newNodes.filter(
                  (n) => n.type === "job" && n.id !== jobId
                );

                if (existingJobs.length > 0) {
                  //* 이전 Job이 있으면 의존성 엣지 생성 (needs 관계)
                  const previousJob = existingJobs[existingJobs.length - 1];
                  newEdges.push({
                    id: getUniqueEdgeId(previousJob.id, jobId, "job-to-job"),
                    source: previousJob.id,
                    target: jobId,
                    type: "straight",
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      width: 16,
                      height: 16,
                      color: "#3b82f6", //* 파란색으로 의존성 표시
                    },
                    style: { strokeDasharray: "5,5" }, //* 점선으로 의존성 표시
                    data: {
                      isDependency: true,
                      dependencyType: "needs",
                    },
                  });
                } else {
                  //* 첫 번째 Job이면 트리거 → Job 엣지
                  const firstTrigger = newNodes.find(
                    (n) => n.type === "workflowTrigger"
                  );
                  if (firstTrigger) {
                    newEdges.push({
                      id: getUniqueEdgeId(
                        firstTrigger.id,
                        jobId,
                        "trigger-to-job"
                      ),
                      source: firstTrigger.id,
                      target: jobId,
                      type: "straight",
                      markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 16,
                        height: 16,
                        color: "#64748b",
                      },
                    });
                  }
                }
              } else if (block.type === "step") {
                //* Step 추가: 현재 Job의 서브플로우에 추가
                if (!currentJobId || !currentSubflowId) {
                  console.error("Job이나 Subflow가 없습니다.");
                  return;
                }

                //* 현재 Job의 서브플로우 찾기
                const subflowNode = newNodes.find(
                  (n) => n.id === currentSubflowId
                );
                if (!subflowNode) {
                  console.error("서브플로우를 찾을 수 없습니다.");
                  return;
                }

                //* 해당 서브플로우의 Step 개수
                const subflowSteps = newNodes.filter(
                  (n) => n.parentId === subflowNode.id && n.type === "step"
                );

                //* Step 노드 크기/간격 상수
                const SUBFLOW_PADDING_X = 32;
                const SUBFLOW_PADDING_Y = 100;
                const STEP_WIDTH = 220;
                const STEP_HEIGHT = 56;
                const STEP_MARGIN = 56 + 56;

                //* Step position (서브플로우 기준 상대좌표)
                const stepX = SUBFLOW_PADDING_X;
                const stepY =
                  SUBFLOW_PADDING_Y +
                  subflowSteps.length * (STEP_HEIGHT + STEP_MARGIN);

                const stepId = getUniqueId("step");
                const stepNode: Node = {
                  id: stepId,
                  type: "step",
                  position: { x: stepX, y: stepY },
                  parentId: subflowNode.id,
                  extent: "parent",
                  data: {
                    label: block.name,
                    type: "step",
                    domain: block.domain,
                    task: block.task,
                    description: block.description,
                    config: {
                      ...block.config,
                    },
                    parentId: subflowNode.id,
                    jobName: currentJobId
                      ? `job${newNodes.filter((n) => n.type === "job").length}`
                      : "default-job", //* 현재 Job의 이름으로 설정
                  },
                };
                newNodes.push(stepNode);

                //* Step 간 엣지 (순차 연결)
                if (subflowSteps.length > 0) {
                  const prevStep = subflowSteps[subflowSteps.length - 1];
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
                    data: { isParentChild: true },
                  });
                } else {
                  //* 첫 Step이면 Subflow → Step 엣지
                  newEdges.push({
                    id: getUniqueEdgeId(
                      subflowNode.id,
                      stepId,
                      "subflow-to-step"
                    ),
                    source: subflowNode.id,
                    target: stepId,
                    type: "straight",
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      width: 16,
                      height: 16,
                      color: "#64748b",
                    },
                    style: { zIndex: 10 },
                    data: { isParentChild: true },
                  });
                }

                //* 서브플로우 크기 동적 조절 (Step 개수/크기 반영)
                const stepCount = subflowSteps.length + 1;
                const subflowWidth = STEP_WIDTH + SUBFLOW_PADDING_X * 2;
                const subflowHeight =
                  SUBFLOW_PADDING_Y * 2 +
                  stepCount * STEP_HEIGHT +
                  (stepCount - 1) * STEP_MARGIN;
                subflowNode.data.stepCount = stepCount;
                subflowNode.data.width = subflowWidth;
                subflowNode.data.height = Math.max(120, subflowHeight);
                subflowNode.style = {
                  minWidth: subflowWidth,
                  minHeight: Math.max(120, subflowHeight),
                };
              }
            });

            setNodes(newNodes);
            setEdges(newEdges);
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
            //* 트리거 노드 추가 - 워크플로우의 시작점
            const triggerCount = newNodes.filter(
              (n) => n.type === "workflowTrigger"
            ).length;
            const triggerId = getUniqueId("trigger");
            const triggerNode: Node = {
              id: triggerId,
              type: "workflowTrigger",
              position: { x: 200 + triggerCount * 350, y: 50 },
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
            //* Job 노드 추가 - 워크플로우의 실행 단위 (여러 Job 지원)
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

            const jobNode: Node = {
              id: jobId,
              type: "job",
              position: { x: 200 + jobCount * 350, y: 250 },
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

            //* 서브플로우 노드 추가 (Job마다 1:1) - Step들을 담는 컨테이너
            const subflowId = getUniqueId("subflow");
            const SUBFLOW_WIDTH = 320;
            const SUBFLOW_HEIGHT = 180;
            const subflowNode: Node = {
              id: subflowId,
              type: "subflow",
              position: { x: 0, y: 180 }, //* 부모(Job) 기준 바로 아래 일직선
              parentId: jobId,
              data: {
                label: `${block.name} - Subflow`,
                type: "subflow",
                jobId,
                stepCount: 0,
                width: SUBFLOW_WIDTH,
                height: SUBFLOW_HEIGHT,
              },
              style: { minWidth: SUBFLOW_WIDTH, minHeight: SUBFLOW_HEIGHT },
            };
            newNodes.push(subflowNode);
            //* 엣지: Job → Subflow
            newEdges.push({
              id: `job-to-subflow-${jobId}-${subflowId}`,
              source: jobId,
              target: subflowId,
              type: "straight",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: "#64748b",
              },
            });
            //* Job 간 의존성 설정
            const existingJobs = newNodes.filter(
              (n) => n.type === "job" && n.id !== jobId
            );

            if (existingJobs.length > 0) {
              //* 이전 Job이 있으면 의존성 엣지 생성 (needs 관계)
              const previousJob = existingJobs[existingJobs.length - 1];
              newEdges.push({
                id: `job-to-job-${previousJob.id}-${jobId}`,
                source: previousJob.id,
                target: jobId,
                type: "straight",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: "#3b82f6", //* 파란색으로 의존성 표시
                },
                style: { strokeDasharray: "5,5" }, //* 점선으로 의존성 표시
                data: {
                  isDependency: true,
                  dependencyType: "needs",
                },
              });
            } else {
              //* 첫 번째 Job이면 트리거 → Job 엣지
              const firstTrigger = newNodes.find(
                (n) => n.type === "workflowTrigger"
              );
              if (firstTrigger) {
                newEdges.push({
                  id: `trigger-to-job-${firstTrigger.id}-${jobId}`,
                  source: firstTrigger.id,
                  target: jobId,
                  type: "straight",
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 16,
                    height: 16,
                    color: "#64748b",
                  },
                });
              }
            }

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

                  //* Step을 새 Job의 subflow로 이동
                  const newSubflowNode = newNodes.find(
                    (n) => n.type === "subflow" && n.parentId === jobId
                  );
                  if (newSubflowNode) {
                    node.parentId = newSubflowNode.id;
                  }
                }
              }
            });
          } else if (block.type === "step") {
            //* Step 추가: 여러 Job 중에서 선택하여 서브플로우에 추가
            const allJobs = newNodes.filter((n) => n.type === "job");
            if (allJobs.length === 0) {
              alert("Job이 필요합니다. 먼저 Job 블록을 추가해주세요.");
              return;
            }

            //* 가장 최근 Job을 기본으로 선택 (나중에 사용자가 선택할 수 있도록 개선 가능)
            const targetJob = allJobs[allJobs.length - 1];
            const targetJobConfig = targetJob.data.config as Record<
              string,
              unknown
            >;
            const jobs = targetJobConfig.jobs as
              | Record<string, unknown>
              | undefined;
            const jobName = Object.keys(jobs || {})[0] || "default-job";
            //* 해당 Job의 서브플로우 찾기
            const subflowNode = newNodes.find(
              (n) => n.type === "subflow" && n.parentId === targetJob.id
            );
            if (!subflowNode) {
              alert("서브플로우가 필요합니다. Job을 먼저 추가해주세요.");
              return;
            }
            //* 해당 서브플로우의 Step 개수
            const subflowSteps = newNodes.filter(
              (n) => n.parentId === subflowNode.id && n.type === "step"
            );
            //* Step 노드 크기/간격 상수
            const SUBFLOW_PADDING_X = 32;
            const SUBFLOW_PADDING_Y = 100;
            const STEP_WIDTH = 220;
            const STEP_HEIGHT = 56;
            const STEP_MARGIN = 56 + 56;
            //* Step position (서브플로우 기준 상대좌표)
            const stepX = SUBFLOW_PADDING_X;
            const stepY =
              SUBFLOW_PADDING_Y +
              subflowSteps.length * (STEP_HEIGHT + STEP_MARGIN);
            const stepId = getUniqueId("step");
            const stepNode: Node = {
              id: stepId,
              type: "step",
              position: { x: stepX, y: stepY },
              parentId: subflowNode.id,
              extent: "parent",
              data: {
                label: block.name,
                type: "step",
                domain: block.domain,
                task: block.task,
                description: block.description,
                config: {
                  ...block.config,
                },
                parentId: subflowNode.id,
                jobName: jobName, //* 부모 Job의 job-name과 일치시킴
              },
            };
            newNodes.push(stepNode);
            //* Step 간 엣지 (순차 연결)
            if (subflowSteps.length > 0) {
              const prevStep = subflowSteps[subflowSteps.length - 1];
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
                data: { isParentChild: true },
              });
            } else {
              //* 첫 Step이면 Subflow → Step 엣지
              newEdges.push({
                id: `subflow-to-step-${subflowNode.id}-${stepId}`,
                source: subflowNode.id,
                target: stepId,
                type: "straight",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 16,
                  height: 16,
                  color: "#64748b",
                },
                style: { zIndex: 10 },
                data: { isParentChild: true },
              });
            }
            //* 서브플로우 크기 동적 조절 (Step 개수/크기 반영)
            const stepCount = subflowSteps.length + 1;
            const subflowWidth = STEP_WIDTH + SUBFLOW_PADDING_X * 2;
            const subflowHeight =
              SUBFLOW_PADDING_Y * 2 +
              stepCount * STEP_HEIGHT +
              (stepCount - 1) * STEP_MARGIN;
            subflowNode.data.stepCount = stepCount;
            subflowNode.data.width = subflowWidth;
            subflowNode.data.height = Math.max(120, subflowHeight);
            subflowNode.style = {
              minWidth: subflowWidth,
              minHeight: Math.max(120, subflowHeight),
            };
          }
          setNodes(newNodes);
          setEdges(newEdges);
        } catch (error) {
          console.error("드롭 처리 오류:", error);
        }
      }
    },
    [nodes, setNodes, setEdges, edges]
  );

  //* 노드/엣지 변경 핸들러 - React Flow의 내장 변경 감지
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
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

  //* 노드만 삭제 (하위 노드들은 독립적으로 만듦)
  //! 상위 노드 삭제 시 하위 노드들을 독립적으로 만드는 안전한 삭제 방식
  const deleteNodeOnly = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) {
        console.warn(`삭제할 노드를 찾을 수 없습니다: ${nodeId}`);
        return;
      }

      //* Job 노드인 경우 서브플로우 처리
      if (nodeToDelete.type === "job") {
        handleSubflowNodes(nodeId, "independent");
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
    [setNodes, setEdges, selectedNode, nodes, handleSubflowNodes]
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

      //* Job 노드인 경우 서브플로우 처리
      if (nodeToDelete.type === "job") {
        const subflowNodeIds = handleSubflowNodes(nodeId, "delete");
        console.log(
          `Job 노드 ${nodeId}의 서브플로우 노드들: ${subflowNodeIds.join(", ")}`
        );
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
    [setNodes, setEdges, selectedNode, nodes, handleSubflowNodes]
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

  //* onPaneClick: 노드가 아닌 곳 클릭 시 YAML 패널 닫기
  const handlePaneClick = useCallback(() => {
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
          <div className="flex-1 relative min-w-0 min-h-0 overflow-hidden w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              style={{ backgroundColor: "#f9fafb" }}
              snapToGrid={true}
              snapGrid={[15, 15]}
              multiSelectionKeyCode="Shift"
              deleteKeyCode="Delete"
              minZoom={0.5}
              maxZoom={2}
              zoomOnScroll={true}
              zoomOnPinch={true}
              panOnScroll={true}
              panOnDrag={true}
              //* 확대/축소 및 팬 동작을 예제와 동일하게 명시
              onPaneClick={handlePaneClick}
            >
              <Background color="#e5e7eb" gap={20} />
              <Controls />
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
                </div>
              </Panel>

              {/* 하단 정보 패널 */}
              <Panel position="bottom-center">
                <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-xs text-gray-500">
                  <Lightbulb size={14} className="inline mr-1" />{" "}
                  <strong>팁:</strong> 노드를 클릭하여 선택한 후, 우측 상단의
                  액션 버튼을 사용하세요.{" "}
                  <Save size={12} className="inline mx-1" /> 저장 버튼을 눌러
                  서버 데이터를 확인하세요.
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </NodeDeleteContext.Provider>
    </NodeUpdateContext.Provider>
  );
};
