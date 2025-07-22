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
  //* Job 블록들 처리
  //* ========================================
  const jobBlocks = blocks.filter((block) => block.type === "job");
  jobBlocks.forEach((jobBlock, index) => {
    const jobNode: Node = {
      id: jobBlock.id || `job-${nodeIdCounter++}`,
      type: "job",
      position: { x: 200 + index * 350, y: 250 }, // Job도 x축으로 일정 간격 배치
      data: {
        label: jobBlock.name,
        type: "job",
        category: jobBlock.category,
        description: jobBlock.description,
        config: jobBlock.config,
      },
    };
    nodes.push(jobNode);

    //* 트리거에서 Job으로 연결 (첫 번째 트리거가 있으면 연결)
    //* 단, 여러 블록을 한 번에 처리할 때만 연결 (드래그 드롭 시에는 제외)
    if (blocks.length > 1) {
      const firstTrigger = nodes.find(
        (node) => node.data.type === "workflow_trigger"
      );
      if (firstTrigger) {
        edges.push({
          id: `trigger-to-job-${jobNode.id}`,
          source: firstTrigger.id, // 첫 번째 트리거 노드
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
  });

  //* ========================================
  //* Step 블록들 처리
  //* ========================================
  const stepBlocks = blocks.filter((block) => block.type === "step");
  const jobStepMap = new Map<string, Node[]>(); // Job별 Step 노드들 추적

  // Step을 각 Job별로 y축으로 일정 간격 배치
  stepBlocks.forEach((stepBlock, index) => {
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
      // 해당 Job에 속한 Step 개수
      const jobSteps = jobStepMap.get(parentJob.id) || [];
      const stepNode: Node = {
        id: stepBlock.id || `step-${nodeIdCounter++}`,
        type: "step",
        position: {
          x: parentJob.position.x,
          y: parentJob.position.y + 120 + jobSteps.length * 80,
        },
        parentNode: parentJob.id,
        data: {
          label: stepBlock.name,
          type: "step",
          category: stepBlock.category,
          description: stepBlock.description,
          config: stepBlock.config,
          parentId: parentJob.id,
          jobName:
            stepBlock["job-name"] ||
            Object.keys(parentJob.data.config?.jobs || {})[0] ||
            "",
        },
      };
      nodes.push(stepNode);
      if (!jobStepMap.has(parentJob.id)) {
        jobStepMap.set(parentJob.id, []);
      }
      jobStepMap.get(parentJob.id)!.push(stepNode);

      //* Job과 Step 연결
      edges.push({
        id: `job-to-step-${stepNode.id}`,
        source: parentJob.id,
        target: stepNode.id,
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
      //* Job이 없어도 Step 노드 생성 (드롭 핸들러에서 처리)
      const stepNode: Node = {
        id: `step-${nodeIdCounter++}`,
        type: "step",
        position: { x: 20, y: 60 + index * 80 },
        data: {
          label: stepBlock.name,
          type: "step",
          category: stepBlock.category,
          description: stepBlock.description,
          config: stepBlock.config,
          jobName: stepBlock["job-name"] || "",
        },
      };
      nodes.push(stepNode);
    }
  });

  //* Step과 Step 간 연결 (순차적 실행)
  jobStepMap.forEach((jobSteps) => {
    for (let i = 0; i < jobSteps.length - 1; i++) {
      const currentStep = jobSteps[i];
      const nextStep = jobSteps[i + 1];

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
