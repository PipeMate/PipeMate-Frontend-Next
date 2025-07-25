//* ========================================
//* 데이터 변환 유틸리티
//* ========================================
//* 이 파일은 서버 데이터와 React Flow 노드 간의 변환을 담당합니다.
//* 서버에서 받은 블록 데이터를 React Flow 노드로 변환하고,
//* React Flow 노드를 서버로 보낼 블록 데이터로 변환합니다.

import { Node, Edge, MarkerType } from "reactflow";
import { ServerBlock, WorkflowNodeData } from "../types";

//* ========================================
//* 서버 → React Flow 변환
//* ========================================

//* 서버 블록 데이터를 React Flow 노드로 변환
//? 서버에서 받은 블록 배열을 React Flow에서 사용할 수 있는 노드와 엣지로 변환
export const convertServerBlocksToNodes = (
  blocks: ServerBlock[]
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 1;

  //* ========================================
  //* 트리거 블록 처리
  //* ========================================
  const triggerBlocks = blocks.filter((block) => block.type === "trigger");
  triggerBlocks.forEach((triggerBlock, index) => {
    const triggerNode: Node = {
      id: triggerBlock.id || `trigger-${nodeIdCounter++}`,
      type: "workflowTrigger",
      position: { x: 200 + index * 350, y: 50 }, // 트리거 간격 넓힘
      data: {
        label: triggerBlock.name,
        type: "workflow_trigger",
        category: triggerBlock.category,
        description: triggerBlock.description,
        config: triggerBlock.config,
      },
    };
    nodes.push(triggerNode);
  });

  //* ========================================
  //* Job 블록들 처리 + SubFlow 생성
  //* ========================================
  const jobBlocks = blocks.filter((block) => block.type === "job");
  const jobIdToSubflowId: Record<string, string> = {};
  jobBlocks.forEach((jobBlock, index) => {
    const jobNodeId = jobBlock.id || `job-${nodeIdCounter++}`;
    const jobNode: Node = {
      id: jobNodeId,
      type: "job",
      position: { x: 200 + index * 350, y: 250 },
      data: {
        label: jobBlock.name,
        type: "job",
        category: jobBlock.category,
        description: jobBlock.description,
        config: jobBlock.config,
      },
    };
    nodes.push(jobNode);
    // 각 job마다 subflow 노드 생성
    const subflowId = `subflow-${jobNodeId}`;
    jobIdToSubflowId[jobNodeId] = subflowId;
    const subflowNode: Node = {
      id: subflowId,
      type: "subflow",
      position: { x: jobNode.position.x, y: jobNode.position.y + 100 },
      parentNode: jobNodeId,
      data: {
        label: `${jobBlock.name} Steps`,
        type: "subflow",
        jobId: jobNodeId,
        stepCount: 0,
        height: 120,
      },
    };
    nodes.push(subflowNode);
    // 트리거에서 Job으로 연결 (첫 번째 트리거가 있으면 연결)
    if (blocks.length > 1) {
      const firstTrigger = nodes.find(
        (node) => node.data.type === "workflow_trigger"
      );
      if (firstTrigger) {
        edges.push({
          id: `trigger-to-job-${jobNode.id}`,
          source: firstTrigger.id,
          target: jobNode.id,
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
    // job → subflow 엣지
    edges.push({
      id: `job-to-subflow-${subflowId}`,
      source: jobNodeId,
      target: subflowId,
      type: "straight",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#64748b",
      },
    });
  });

  //* ========================================
  //* Step 블록들 처리 (subflow의 자식으로)
  //* ========================================
  const stepBlocks = blocks.filter((block) => block.type === "step");
  const subflowStepMap = new Map<string, Node[]>();
  stepBlocks.forEach((stepBlock) => {
    // step이 속할 job 찾기
    let parentJob = null;
    if (stepBlock["job-name"] && stepBlock["job-name"].trim() !== "") {
      const jobName = stepBlock["job-name"];
      parentJob = nodes.find(
        (node) =>
          node.data.type === "job" &&
          node.data.config?.jobs &&
          Object.keys(node.data.config.jobs).includes(jobName)
      );
    }
    if (!parentJob) {
      parentJob = nodes.find((node) => node.data.type === "job");
    }
    if (parentJob) {
      const subflowId = jobIdToSubflowId[parentJob.id];
      const subflowNode = nodes.find((n) => n.id === subflowId);
      const subflowSteps = subflowStepMap.get(subflowId) || [];
      // 서브플로우 크기 및 step 배치 기준 (패딩 포함)
      const SUBFLOW_PADDING_X = 32;
      const SUBFLOW_PADDING_Y = 32;
      const STEP_WIDTH = 220;
      const STEP_HEIGHT = 56;
      const STEP_MARGIN = 18;
      // x: 서브플로우 좌우 패딩 내 중앙 정렬, y: 패딩 아래에서부터 아래로 간격
      const stepX =
        SUBFLOW_PADDING_X +
        (Math.max(STEP_WIDTH, subflowNode ? subflowNode.data.width || 0 : 0) -
          STEP_WIDTH) /
          2;
      const stepY =
        SUBFLOW_PADDING_Y + subflowSteps.length * (STEP_HEIGHT + STEP_MARGIN);
      const stepNode: Node = {
        id: stepBlock.id || `step-${nodeIdCounter++}`,
        type: "step",
        position: {
          x: stepX,
          y: stepY,
        },
        parentNode: subflowId,
        extent: "parent",
        data: {
          label: stepBlock.name,
          type: "step",
          category: stepBlock.category,
          description: stepBlock.description,
          config: stepBlock.config,
          parentId: subflowId,
          jobName:
            stepBlock["job-name"] ||
            Object.keys(parentJob.data.config?.jobs || {})[0] ||
            "",
        },
      };
      nodes.push(stepNode);
      if (!subflowStepMap.has(subflowId)) {
        subflowStepMap.set(subflowId, []);
      }
      subflowStepMap.get(subflowId)!.push(stepNode);
      // subflow의 stepCount, width, height 갱신 (step 개수, 패딩 포함)
      if (subflowNode) {
        const stepCount = subflowStepMap.get(subflowId)!.length;
        // Step 노드들의 width/height 동적 측정값 사용
        const stepWidths = subflowStepMap
          .get(subflowId)!
          .map((n) => n.data.width || 220);
        const stepHeights = subflowStepMap
          .get(subflowId)!
          .map((n) => n.data.height || 56);
        const maxStepWidth = Math.max(...stepWidths, 220);
        const totalStepHeight =
          stepHeights.reduce((acc, h) => acc + h, 0) +
          Math.max(0, stepCount - 1) * STEP_MARGIN;
        const subflowWidth = maxStepWidth + SUBFLOW_PADDING_X * 2;
        const subflowHeight = SUBFLOW_PADDING_Y * 2 + totalStepHeight;
        subflowNode.data.stepCount = stepCount;
        subflowNode.data.height = Math.max(120, subflowHeight);
        subflowNode.data.width = Math.max(320, subflowWidth);
        subflowNode.style = {
          ...subflowNode.style,
          minWidth: subflowNode.data.width,
          minHeight: subflowNode.data.height,
        };
      }
    }
  });
  // Step 간 엣지 (subflow 내부에서만)
  subflowStepMap.forEach((steps) => {
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];
      edges.push({
        id: `step-to-step-${currentStep.id}-${nextStep.id}`,
        source: currentStep.id,
        target: nextStep.id,
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
  });

  return { nodes, edges };
};

//* ========================================
//* React Flow → 서버 변환
//* ========================================

//* React Flow 노드를 서버 블록으로 변환 (연결 관계 고려)
//? React Flow의 노드 배열을 서버로 보낼 수 있는 블록 배열로 변환
export const convertNodesToServerBlocks = (
  nodes: Node[],
  edges?: Edge[]
): ServerBlock[] => {
  const blocks: ServerBlock[] = [];
  const processedNodes = new Set<string>();

  //* 노드 연결 관계를 기반으로 순서 결정
  const getNodeOrder = (): string[] => {
    const order: string[] = [];
    const visited = new Set<string>();

    //* 워크플로우 트리거 노드부터 시작
    const triggerNodes = nodes.filter(
      (node) => (node.data as WorkflowNodeData).type === "workflow_trigger"
    );

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      order.push(nodeId);

      //* 연결된 자식 노드들 처리 (edges에서 추출)
      if (edges) {
        const children = edges
          .filter((edge) => edge.source === nodeId)
          .map((edge) => edge.target);
        children.forEach((childId) => traverse(childId));
      }
    };

    //* 각 트리거 노드부터 순회
    triggerNodes.forEach((triggerNode) => traverse(triggerNode.id));

    //* 연결되지 않은 노드들 추가
    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        order.push(node.id);
      }
    });

    return order;
  };

  //* 순서대로 노드 처리
  const nodeOrder = getNodeOrder();

  nodeOrder.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || processedNodes.has(nodeId)) return;

    const nodeData = node.data as WorkflowNodeData;
    processedNodes.add(nodeId);

    //* 노드 타입에 따른 블록 생성
    if (nodeData.type === "workflow_trigger") {
      blocks.push({
        name: nodeData.label,
        type: "trigger",
        category: nodeData.category,
        description: nodeData.description,
        config: nodeData.config,
      });
    } else if (nodeData.type === "job") {
      //* Job의 job-name 추출 (config.jobs에서 첫 번째 키)
      const jobConfig = nodeData.config.jobs || {};
      const jobName = Object.keys(jobConfig)[0] || "default-job";

      blocks.push({
        name: nodeData.label,
        type: "job",
        category: nodeData.category,
        description: nodeData.description,
        "job-name": jobName,
        config: nodeData.config,
      });
    } else if (nodeData.type === "step") {
      blocks.push({
        name: nodeData.label,
        type: "step",
        category: nodeData.category,
        description: nodeData.description,
        "job-name": nodeData.jobName,
        config: nodeData.config,
      });
    }
  });

  return blocks;
};
