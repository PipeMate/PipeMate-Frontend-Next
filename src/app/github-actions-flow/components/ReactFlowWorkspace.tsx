//* 인터랙티브 React Flow 워크스페이스 컴포넌트
"use client";

import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import ReactFlow, {
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
} from "reactflow";
import "reactflow/dist/style.css";
import "@/styles/reactflow.css";

import { ReactFlowWorkspaceProps, ServerBlock } from "../types";
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
import { Save, ClipboardList, Trash2, Lightbulb } from "lucide-react";

//* 커스텀 노드 타입 정의
const nodeTypes: NodeTypes = {
  workflowTrigger: WorkflowTriggerNode,
  job: JobNode,
  step: StepNode,
};

//* 노드 데이터 업데이트 Context
type UpdateNodeDataFunction = (
  nodeId: string,
  newData: Record<string, unknown>
) => void;

type DeleteNodeFunction = (nodeId: string) => void;
const NodeUpdateContext = createContext<UpdateNodeDataFunction | null>(null);
const NodeDeleteContext = createContext<DeleteNodeFunction | null>(null);

//* Context 사용 훅
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
export const ReactFlowWorkspace = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
}: ReactFlowWorkspaceProps) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { setSidebarExtra } = useLayout();

  //* 초기 노드 설정
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

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());

  //* 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setSidebarExtra(<DragDropSidebar />);
    return () => setSidebarExtra(null);
  }, [setSidebarExtra]);

  //* 엣지 연결 핸들러
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  //* 노드 데이터 업데이트 함수
  const updateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  //* 드래그 오버 핸들러
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  //* 드롭 핸들러
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = document
        .querySelector(".react-flow")
        ?.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/reactflow");

      if (data && reactFlowBounds) {
        try {
          const block: ServerBlock = JSON.parse(data as string);

          const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          };

          //* 기존 노드들의 ID를 확인해서 중복되지 않는 고유한 ID 생성
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

          //* 블록 타입에 따라 노드 생성
          let newNode: Node;

          if (block.type === "trigger") {
            newNode = {
              id: getUniqueId("trigger"),
              type: "workflowTrigger",
              position: {
                x: position.x,
                y: position.y,
              },
              data: {
                label: block.name,
                type: "workflow_trigger",
                category: block.category,
                description: block.description,
                config: block.config,
              },
            };
          } else if (block.type === "job") {
            newNode = {
              id: getUniqueId("job"),
              type: "job",
              position: {
                x: position.x,
                y: position.y,
              },
              draggable: true,
              data: {
                label: block.name,
                type: "job",
                category: block.category,
                description: block.description,
                config: block.config,
              },
            };
          } else if (block.type === "step") {
            //* 가장 가까운 Job 찾기
            const targetJob = nodes.find((node) => node.data.type === "job");

            if (targetJob) {
              //* job-name을 실제 Job의 이름으로 설정
              const actualJobName = Object.keys(
                targetJob.data.config?.jobs || {}
              )[0];

              const stepIndex = nodes.filter(
                (n) => n.parentNode === targetJob.id
              ).length;
              newNode = {
                id: getUniqueId("step"),
                type: "step",
                position: {
                  x: 8,
                  y: 58 + stepIndex * 52, // Job 헤더(50px) + 여백(8px) + Step 간격(52px)
                },
                parentNode: targetJob.id,
                data: {
                  label: block.name,
                  type: "step",
                  category: block.category,
                  description: block.description,
                  config: block.config,
                  parentId: targetJob.id,
                  jobName: actualJobName || "",
                },
              };

              //* Job 노드의 크기를 Step 개수에 맞게 조정
              const stepCount = stepIndex + 1;
              const jobHeaderHeight = 50;
              const stepHeight = 40;
              const stepMargin = 12;
              const jobBottomMargin = 16;
              const jobHeight = Math.max(
                100,
                jobHeaderHeight +
                  stepCount * (stepHeight + stepMargin) +
                  jobBottomMargin
              );

              updateNodeData(targetJob.id, {
                stepCount: stepCount,
                height: jobHeight,
              });
            } else {
              alert("Job이 필요합니다. 먼저 Job 블록을 추가해주세요.");
              return;
            }
          } else {
            return;
          }

          setNodes((nds) => [...nds, newNode]);

          //* 드래그 드롭 시 자동 연결 로직
          if (block.type === "job") {
            //* Job을 추가할 때 첫 번째 트리거와 연결
            const firstTrigger = nodes.find(
              (n) => n.data.type === "workflow_trigger"
            );
            if (firstTrigger) {
              const newEdgeId = `trigger-to-job-${newNode.id}`;

              //* 중복 엣지 확인
              const existingEdge = edges.find(
                (e) => e.source === firstTrigger.id && e.target === newNode.id
              );

              if (!existingEdge) {
                const newEdge = {
                  id: newEdgeId,
                  source: firstTrigger.id,
                  target: newNode.id,
                  type: "smoothstep",
                };

                setEdges((eds) => [...eds, newEdge]);
              } else {
                // Edge already exists, skipping
              }
            }
          } else if (block.type === "step") {
            //* Step을 추가할 때 Job과 연결하고, 이전 Step과도 연결
            const targetJob = nodes.find((node) => node.data.type === "job");

            if (targetJob) {
              //* 같은 Job의 다른 Step들 찾기 (부모-자식 관계 고려)
              const jobSteps = nodes.filter(
                (n) => n.parentNode === targetJob.id && n.data.type === "step"
              );

              //* Job과 Step 연결 (부모-자식 관계이지만 엣지로 연결)
              const jobToStepEdgeId = `job-to-step-${newNode.id}`;
              const existingJobEdge = edges.find(
                (e) => e.source === targetJob.id && e.target === newNode.id
              );

              if (!existingJobEdge) {
                const jobToStepEdge = {
                  id: jobToStepEdgeId,
                  source: targetJob.id,
                  target: newNode.id,
                  type: "smoothstep",
                  //* 부모-자식 노드 간 엣지가 제대로 보이도록 설정
                  style: { zIndex: 10 },
                  data: { isParentChild: true },
                };
                setEdges((eds) => [...eds, jobToStepEdge]);
              }

              //* 이전 Step과 현재 Step 연결 (순차적 실행)
              if (jobSteps.length > 0) {
                const previousStep = jobSteps[jobSteps.length - 1];
                const stepToStepEdgeId = `step-to-step-${previousStep.id}-${newNode.id}`;
                const existingStepEdge = edges.find(
                  (e) => e.source === previousStep.id && e.target === newNode.id
                );

                if (!existingStepEdge) {
                  const stepToStepEdge = {
                    id: stepToStepEdgeId,
                    source: previousStep.id,
                    target: newNode.id,
                    type: "smoothstep",
                    //* 부모-자식 노드 간 엣지가 제대로 보이도록 설정
                    style: { zIndex: 10 },
                    data: { isParentChild: true },
                  };
                  setEdges((eds) => [...eds, stepToStepEdge]);
                }
              }
            }
          }
        } catch (error) {
          console.error("드롭 처리 오류:", error);
        }
      }
    },
    [nodes, setNodes, setEdges, updateNodeData, edges]
  );

  //* 노드 선택 핸들러
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);

      // 선택된 노드를 ServerBlock 형식으로 변환하여 콜백 호출
      if (onNodeSelect) {
        const selectedBlock: ServerBlock = {
          name: node.data.label,
          type:
            node.data.type === "workflow_trigger" ? "trigger" : node.data.type,
          category: node.data.category,
          description: node.data.description,
          "job-name": node.data.jobName,
          config: node.data.config,
        };
        onNodeSelect(selectedBlock);
      }
    },
    [onNodeSelect]
  );

  //* 노드 삭제 함수
  const onNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  //* 워크스페이스 초기화
  const clearWorkspace = useCallback(() => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  //* 워크플로우 저장 함수
  const saveWorkflow = useCallback(() => {
    const blocks = convertNodesToServerBlocks(nodes);
    console.log("저장된 워크플로우 데이터:", JSON.stringify(blocks, null, 2));
    alert("워크플로우가 저장되었습니다! 콘솔을 확인하세요.");
    onWorkflowChange(blocks);
  }, [nodes, onWorkflowChange]);

  //* 예제 워크플로우 추가
  const addExampleWorkflow = useCallback(() => {
    const exampleBlocks: ServerBlock[] = [
      {
        name: "워크플로우 기본 설정",
        type: "trigger",
        category: "workflow",
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
        category: "workflow",
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
        category: "workflow",
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
        category: "setup",
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
        category: "build",
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
        category: "test",
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
        category: "docker",
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
        category: "deploy",
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
        category: "deploy",
        description: "AWS EC2 서버에 SSH를 통해 배포하는 단계입니다.",
        config: {
          name: "Deploy to AWS EC2",
          uses: "appleboy/ssh-action@v0.1.10",
          with: {
            host: "${{ secrets.AWS_HOST_IP }}",
            username: "${{ secrets.REMOTE_USER }}",
            key: "${{ secrets.AWS_EC2_PRIVATE_KEY }}",
            port: "${{ secrets.REMOTE_SSH_PORT }}",
            script:
              "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
          },
        },
      },
    ];

    const { nodes: exampleNodes, edges: exampleEdges } =
      convertServerBlocksToNodes(exampleBlocks);
    setNodes(exampleNodes);
    setEdges(exampleEdges);
  }, [setNodes, setEdges]);

  //* 워크플로우 변경 감지 및 콜백 호출
  useEffect(() => {
    if (nodes.length > 0 && onWorkflowChange) {
      try {
        //* 노드를 서버 블록으로 변환
        const blocks = convertNodesToServerBlocks(nodes);
        onWorkflowChange(blocks);
      } catch (error) {
        console.error("워크플로우 생성 오류:", error);
      }
    }
  }, [nodes, edges, onWorkflowChange]);

  // onPaneClick: 노드가 아닌 곳 클릭 시 YAML 패널 닫기
  const handlePaneClick = useCallback(() => {
    if (onNodeSelect) onNodeSelect(undefined);
  }, [onNodeSelect]);

  //* 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-gray-500">
        React Flow 워크스페이스 로딩 중...
      </div>
    );
  }

  return (
    <NodeUpdateContext.Provider value={updateNodeData}>
      <NodeDeleteContext.Provider value={onNodeDelete}>
        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden w-full h-full">
          {/* React Flow 영역 */}
          <div className="flex-1 relative min-w-0 min-h-0 overflow-hidden w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
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
              minZoom={0.1}
              maxZoom={4}
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
                </div>
              </Panel>

              {/* 하단 정보 패널 */}
              <Panel position="bottom-center">
                <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-sm text-xs text-gray-500">
                  <Lightbulb size={14} className="inline mr-1" />{" "}
                  <strong>팁:</strong> 노드를 클릭하여 YAML을 확인하고,{" "}
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
