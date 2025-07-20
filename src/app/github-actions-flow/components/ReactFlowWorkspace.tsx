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
import { YamlPreviewPanel } from "./YamlPreviewPanel";
import {
  INITIAL_NODES,
  INITIAL_EDGES,
} from "../constants/reactFlowDefinitions";
import {
  convertNodesToServerBlocks,
  convertServerBlocksToNodes,
} from "../utils/dataConverter";

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
const NodeUpdateContext = createContext<UpdateNodeDataFunction | null>(null);

//* Context 사용 훅
export const useNodeUpdate = () => {
  const updateNodeData = useContext(NodeUpdateContext);
  if (!updateNodeData) {
    throw new Error("useNodeUpdate must be used within ReactFlowWorkspace");
  }
  return updateNodeData;
};

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export const ReactFlowWorkspace = ({
  onWorkflowChange,
  initialBlocks,
}: ReactFlowWorkspaceProps) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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

  //* 엣지 연결 핸들러
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  //* 노드 선택 핸들러
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

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

  //* 선택된 노드를 서버 블록으로 변환
  const selectedBlock = selectedNode
    ? ({
        name: selectedNode.data.label,
        type:
          selectedNode.data.type === "workflow_trigger"
            ? "trigger"
            : selectedNode.data.type,
        category: selectedNode.data.category,
        description: selectedNode.data.description,
        "job-name": selectedNode.data.jobName,
        config: selectedNode.data.config,
      } as ServerBlock)
    : undefined;

  //* 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          color: "#6b7280",
        }}
      >
        React Flow 워크스페이스 로딩 중...
      </div>
    );
  }

  return (
    <NodeUpdateContext.Provider value={updateNodeData}>
      <div
        style={{
          flex: 1,
          display: "flex",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* React Flow 영역 */}
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            style={{
              backgroundColor: "#f9fafb",
            }}
            //* 드래그 앤 드롭 설정
            snapToGrid={true}
            snapGrid={[15, 15]}
            //* 선택 설정
            multiSelectionKeyCode="Shift"
            deleteKeyCode="Delete"
            //* 줌 설정
            minZoom={0.1}
            maxZoom={4}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls />
            <MiniMap
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
              }}
              nodeColor="#3b82f6"
            />

            {/* 상단 컨트롤 패널 */}
            <Panel position="top-right">
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "8px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={saveWorkflow}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    fontWeight: "600",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#059669";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#10b981";
                  }}
                >
                  💾 저장
                </button>
                <button
                  onClick={addExampleWorkflow}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                  }}
                >
                  📋 예제 추가
                </button>
                <button
                  onClick={clearWorkspace}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ef4444";
                  }}
                >
                  🗑️ 초기화
                </button>
              </div>
            </Panel>

            {/* 하단 정보 패널 */}
            <Panel position="bottom-left">
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                💡 <strong>사용법:</strong> 노드를 클릭하여 YAML을 확인하고, 💾
                저장 버튼을 눌러 서버 데이터를 확인하세요.
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* YAML 미리보기 패널 */}
        <YamlPreviewPanel
          blocks={convertNodesToServerBlocks(nodes)}
          selectedBlock={selectedBlock}
        />
      </div>
    </NodeUpdateContext.Provider>
  );
};
