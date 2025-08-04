import { useState, useCallback } from "react";
import { ServerBlock, WorkflowNodeData } from "../../../types";
import { AreaNodeData, NodeType } from "../types";
import { toast } from "react-toastify";

/**
 * 드래그 앤 드롭 상태 관리 훅
 */
export const useDragDrop = () => {
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<AreaNodeData | null>(null);

  /**
   * 드래그 오버 핸들러 - 영역별
   */
  const handleDragOver = useCallback((e: React.DragEvent, areaKey: string) => {
    e.preventDefault();
    setDragOverArea(areaKey);
  }, []);

  /**
   * 드래그 오버 핸들러 - Job 내부 Step 영역
   */
  const handleJobDragOver = useCallback((e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverJobId(jobId);
  }, []);

  /**
   * 드래그 리브 핸들러 - 영역별
   */
  const handleDragLeave = useCallback((e: React.DragEvent, areaKey: string) => {
    e.preventDefault();
    setDragOverArea(null);
  }, []);

  /**
   * 드래그 리브 핸들러 - Job 내부 Step 영역
   */
  const handleJobDragLeave = useCallback(
    (e: React.DragEvent, jobId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverJobId(null);
    },
    []
  );

  /**
   * 드래그 엔드 핸들러 - 모든 드래그 상태 초기화
   */
  const handleDragEnd = useCallback(() => {
    setDragOverArea(null);
    setDragOverJobId(null);
    setDraggedNode(null);
  }, []);

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
   * 드래그 오버 시 스타일 결정
   */
  const getDragOverStyle = useCallback(
    (areaKey: string, isJobStep: boolean = false, jobId?: string) => {
      if (isJobStep && jobId) {
        return dragOverJobId === jobId
          ? "border-orange-500 bg-orange-100/80 border-solid ring-2 ring-orange-300"
          : "";
      }

      if (dragOverArea === areaKey) {
        switch (areaKey) {
          case "trigger":
            return "border-green-500 bg-green-100/80 border-solid ring-2 ring-green-300";
          case "job":
            return "border-blue-500 bg-blue-100/80 border-solid ring-2 ring-blue-300";
          case "step":
            return "border-yellow-500 bg-yellow-100/80 border-solid ring-2 ring-yellow-300";
          default:
            return "border-gray-500 bg-gray-100/80 border-solid ring-2 ring-gray-300";
        }
      }
      return "";
    },
    [dragOverArea, dragOverJobId]
  );

  /**
   * 드롭 데이터 파싱
   */
  const parseDropData = useCallback((e: React.DragEvent) => {
    try {
      const data = e.dataTransfer.getData("application/reactflow");
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("드롭 데이터 파싱 오류:", error);
    }
    return null;
  }, []);

  /**
   * 블록을 노드 데이터로 변환
   */
  const convertBlockToNodeData = useCallback(
    (block: ServerBlock): WorkflowNodeData => {
      return {
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
    },
    []
  );

  /**
   * 블록 타입을 노드 타입으로 변환
   */
  const convertBlockTypeToNodeType = useCallback(
    (blockType: string): NodeType => {
      return blockType === "trigger"
        ? "workflowTrigger"
        : blockType === "job"
        ? "job"
        : "step";
    },
    []
  );

  return {
    dragOverArea,
    dragOverJobId,
    draggedNode,
    handleDragOver,
    handleJobDragOver,
    handleDragLeave,
    handleJobDragLeave,
    handleDragEnd,
    handleNodeDragStart,
    handleNodeDrag,
    getDragOverStyle,
    parseDropData,
    convertBlockToNodeData,
    convertBlockTypeToNodeType,
    setDragOverArea,
    setDragOverJobId,
  };
};
