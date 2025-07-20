//* ========================================
//* 데이터 변환 유틸리티
//* ========================================
//* 이 파일은 서버 데이터와 React Flow 노드 간의 변환을 담당합니다.
//* 서버에서 받은 블록 데이터를 React Flow 노드로 변환하고,
//* React Flow 노드를 서버로 보낼 블록 데이터로 변환합니다.

import { Node, Edge } from "reactflow";
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
  const triggerBlock = blocks.find((block) => block.type === "trigger");
  if (triggerBlock) {
    const triggerNode: Node = {
      id: `trigger-${nodeIdCounter++}`,
      type: "workflowTrigger",
      position: { x: 100, y: 100 },
      data: {
        label: triggerBlock.name,
        type: "workflow_trigger",
        category: triggerBlock.category,
        description: triggerBlock.description,
        config: triggerBlock.config,
      },
    };
    nodes.push(triggerNode);
  }

  //* ========================================
  //* Job 블록들 처리
  //* ========================================
  const jobBlocks = blocks.filter((block) => block.type === "job");
  jobBlocks.forEach((jobBlock, index) => {
    const jobNode: Node = {
      id: `job-${nodeIdCounter++}`,
      type: "job",
      position: { x: 100, y: 250 + index * 150 },
      data: {
        label: jobBlock.name,
        type: "job",
        category: jobBlock.category,
        description: jobBlock.description,
        config: jobBlock.config,
      },
    };
    nodes.push(jobNode);

    //* 트리거에서 Job으로 연결
    if (triggerBlock) {
      edges.push({
        id: `trigger-to-job-${jobNode.id}`,
        source: nodes[0].id, // 트리거 노드
        target: jobNode.id,
        type: "smoothstep",
      });
    }
  });

  //* ========================================
  //* Step 블록들 처리
  //* ========================================
  const stepBlocks = blocks.filter((block) => block.type === "step");
  stepBlocks.forEach((stepBlock, index) => {
    //* Step이 속할 Job 찾기
    const parentJob = nodes.find(
      (node) =>
        node.data.type === "job" &&
        node.data.config?.jobs &&
        Object.keys(node.data.config.jobs).includes(stepBlock["job-name"] || "")
    );

    if (parentJob) {
      const stepNode: Node = {
        id: `step-${nodeIdCounter++}`,
        type: "step",
        position: { x: 50, y: 350 + index * 80 },
        parentNode: parentJob.id,
        data: {
          label: stepBlock.name,
          type: "step",
          category: stepBlock.category,
          description: stepBlock.description,
          config: stepBlock.config,
          parentId: parentJob.id,
          jobName: stepBlock["job-name"],
        },
      };
      nodes.push(stepNode);
    }
  });

  return { nodes, edges };
};

//* ========================================
//* React Flow → 서버 변환
//* ========================================

//* React Flow 노드를 서버 블록으로 변환
//? React Flow의 노드 배열을 서버로 보낼 수 있는 블록 배열로 변환
export const convertNodesToServerBlocks = (nodes: Node[]): ServerBlock[] => {
  const blocks: ServerBlock[] = [];

  nodes.forEach((node) => {
    const nodeData = node.data as WorkflowNodeData;

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
