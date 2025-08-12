import { useState, useCallback, useRef } from "react";
import { ServerBlock, WorkflowNodeData } from "../../../types";
import { AreaNodeData, NodeType } from "../types";
import { toast } from "react-toastify";

/**
 * 드래그 앤 드롭 상태 관리 훅
 * 키보드 접근성 및 터치 DnD 지원 포함
 */
export const useDragDrop = () => {
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<AreaNodeData | null>(null);
  
  //* 터치 드래그 상태 관리
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  
  //* 키보드 포커스 상태 관리
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [focusedArea, setFocusedArea] = useState<string | null>(null);

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
    setIsTouchDragging(false);
    setTouchStartPos(null);
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

  //* ========================================
  //* 터치 드래그 앤 드롭 지원
  //* ========================================

  /**
   * 터치 시작 핸들러
   */
  const handleTouchStart = useCallback((e: React.TouchEvent, node: AreaNodeData) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedNode(node);
  }, []);

  /**
   * 터치 이동 핸들러
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    //* 최소 드래그 거리 확인 (10px)
    if (deltaX > 10 || deltaY > 10) {
      setIsTouchDragging(true);
      e.preventDefault(); //* 스크롤 방지
    }
  }, [touchStartPos]);

  /**
   * 터치 종료 핸들러
   */
  const handleTouchEnd = useCallback(() => {
    setIsTouchDragging(false);
    setTouchStartPos(null);
    setDraggedNode(null);
  }, []);

  //* ========================================
  //* 키보드 접근성 지원
  //* ========================================

  /**
   * 키보드 포커스 설정
   */
  const setFocus = useCallback((nodeId: string | null, area: string | null = null) => {
    setFocusedNodeId(nodeId);
    setFocusedArea(area);
  }, []);

  /**
   * 키보드 네비게이션 핸들러
   */
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent, currentNodeId: string, nodes: AreaNodeData[]) => {
    const currentIndex = nodes.findIndex(node => node.id === currentNodeId);
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % nodes.length;
        setFocus(nodes[nextIndex]?.id || null);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? nodes.length - 1 : currentIndex - 1;
        setFocus(nodes[prevIndex]?.id || null);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const focusedNode = nodes.find(node => node.id === currentNodeId);
        if (focusedNode) {
          //* CustomEvent 대신 직접 노드 선택 처리
          //* 이벤트는 상위 컴포넌트에서 처리하도록 함
          console.log('노드 선택:', focusedNode.data.label);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        const nodeToDelete = nodes.find(node => node.id === currentNodeId);
        if (nodeToDelete) {
          //* CustomEvent 대신 직접 노드 삭제 처리
          //* 이벤트는 상위 컴포넌트에서 처리하도록 함
          console.log('노드 삭제:', nodeToDelete.data.label);
        }
        break;
    }
  }, [setFocus]);

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
   * 포커스 스타일 결정
   */
  const getFocusStyle = useCallback((nodeId: string, areaKey?: string) => {
    if (focusedNodeId === nodeId || focusedArea === areaKey) {
      return "ring-2 ring-blue-500 ring-offset-2";
    }
    return "";
  }, [focusedNodeId, focusedArea]);

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
      switch (blockType) {
        case "trigger":
          return "workflowTrigger";
        case "job":
          return "job";
        case "step":
          return "step";
        default:
          return "step";
      }
    },
    []
  );

  return {
    //* 기존 드래그 앤 드롭 기능
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
    
    //* 터치 드래그 앤 드롭 지원
    isTouchDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    //* 키보드 접근성 지원
    focusedNodeId,
    focusedArea,
    setFocus,
    handleKeyNavigation,
    getFocusStyle,
  };
};
