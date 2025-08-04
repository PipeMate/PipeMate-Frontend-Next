"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ServerBlock, WorkflowNodeData } from "../types";
import { convertNodesToServerBlocks } from "../utils/dataConverter";
import { useLayout } from "@/components/layout/LayoutContext";
import { DragDropSidebar } from "./DragDropSidebar";
import { AreaNode } from "./AreaNode";
import { NodeEditor } from "./NodeEditor";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Save, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//* 새로운 구조의 컴포넌트들과 훅들 import
import {
  AreaBasedWorkflowEditorProps,
  AreaNodeData,
} from "./area-editor/types";
import { useAreaNodes } from "./area-editor/hooks/useAreaNodes";
import { useDragDrop } from "./area-editor/hooks/useDragDrop";
import { useDropHandlers } from "./area-editor/hooks/useDropHandlers";
import { ControlPanel } from "./area-editor/components/ControlPanel";
import { DropArea } from "./area-editor/components/DropArea";
import { EmptyState } from "./area-editor/components/EmptyState";

/**
 * ========================================
 * 영역 기반 워크플로우 에디터 컴포넌트
 * ========================================
 *
 * 드래그 앤 드롭으로 블록을 추가하고, 영역별로 워크플로우를 구성하는 에디터입니다.
 * Trigger, Job, Step 영역으로 나누어져 있으며, 각 영역에 맞는 블록을 배치할 수 있습니다.
 */
export const AreaBasedWorkflowEditor: React.FC<
  AreaBasedWorkflowEditorProps
> = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
  onEditModeToggle,
  isEditing,
}) => {
  //* ========================================
  //* 커스텀 훅 사용
  //* ========================================

  const {
    areaNodes,
    addNode,
    deleteNode,
    updateNode,
    updateNodeData,
    getAllNodes,
    getServerBlocks,
    clearWorkspace,
    updateStepJobNames,
  } = useAreaNodes(initialBlocks, onWorkflowChange);

  const {
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
  } = useDragDrop();

  const { handleDrop, handleAreaDrop, handleJobStepDrop } = useDropHandlers(
    areaNodes,
    addNode,
    () => {
      setDragOverArea(null);
      setDragOverJobId(null);
    }
  );

  //* ========================================
  //* 상태 관리
  //* ========================================

  //* 선택된 노드 상태
  const [selectedNode, setSelectedNode] = useState<AreaNodeData | null>(null);

  //* 편집 중인 노드 상태
  const [editingNode, setEditingNode] = useState<AreaNodeData | null>(null);

  //* 컨트롤 패널 열림/닫힘 상태
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

  //* 레이아웃 컨텍스트에서 사이드바 설정 함수 가져오기
  const { setSidebarExtra } = useLayout();

  //* ========================================
  //* 사이드바 설정
  //* ========================================

  //* 사이드바에 드래그 드롭 패널 설정
  useEffect(() => {
    setSidebarExtra(<DragDropSidebar />);
    return () => setSidebarExtra(null);
  }, [setSidebarExtra]);

  //* ========================================
  //* 이벤트 핸들러
  //* ========================================

  /**
   * 노드 선택 핸들러
   * 사용자가 노드를 클릭했을 때 호출
   */
  const handleNodeSelect = useCallback(
    (node: AreaNodeData) => {
      setSelectedNode(node);

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

  /**
   * 노드 편집 시작
   */
  const handleNodeEdit = useCallback((node: AreaNodeData) => {
    setEditingNode(node);
  }, []);

  /**
   * 노드 편집 저장
   */
  const handleNodeEditSave = useCallback(
    (updatedData: WorkflowNodeData) => {
      if (editingNode) {
        updateNodeData(editingNode.id, updatedData);

        //* Job의 job-name이 변경된 경우 하위 Step들도 업데이트
        if (
          editingNode.type === "job" &&
          updatedData.jobName !== editingNode.data.jobName &&
          updatedData.jobName
        ) {
          updateStepJobNames(editingNode.id, updatedData.jobName);
        }

        setEditingNode(null);
      }
    },
    [editingNode, updateNodeData, updateStepJobNames]
  );

  /**
   * 노드 편집 취소
   */
  const handleNodeEditCancel = useCallback(() => {
    setEditingNode(null);
  }, []);

  /**
   * 워크플로우 저장
   */
  const handleSaveWorkflow = useCallback(() => {
    if (onWorkflowChange) {
      const blocks = getServerBlocks();
      onWorkflowChange(blocks);
    }
  }, [onWorkflowChange, getServerBlocks]); // getServerBlocks 의존성 다시 추가

  /**
   * 워크스페이스 초기화
   */
  const handleClearWorkspace = useCallback(() => {
    clearWorkspace();
    setSelectedNode(null);
  }, [clearWorkspace]);

  /**
   * 노드 삭제
   */
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      deleteNode(nodeId);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [deleteNode, selectedNode]
  );

  //* ========================================
  //* 유틸리티 함수
  //* ========================================

  /**
   * Job별 Step 그룹핑
   */
  const getStepsByJob = useCallback(() => {
    const jobSteps: Record<string, AreaNodeData[]> = {};

    areaNodes.job.forEach((job) => {
      jobSteps[job.id] = areaNodes.step.filter(
        (step) => step.parentId === job.id
      );
    });

    return jobSteps;
  }, [areaNodes]);

  /**
   * 빈 상태 렌더링
   */
  const renderEmptyState = useCallback(
    (
      areaKey: keyof typeof areaNodes,
      title: string,
      isDragOver: boolean,
      isJobStep: boolean = false,
      jobId?: string
    ) => {
      return (
        <EmptyState
          areaKey={areaKey}
          title={title}
          isDragOver={isDragOver}
          isJobStep={isJobStep}
          jobId={jobId}
        />
      );
    },
    []
  );

  //* ========================================
  //* 사이드 이펙트
  //* ========================================

  //* useEffect 제거 - 무한 루프 방지
  //* 대신 노드 변경 시에만 onWorkflowChange 호출

  //* 편집 모드 상태를 노드에 반영하는 useEffect 제거
  //* 편집 모드 상태는 UI 상태이므로 노드 데이터에 반영할 필요 없음
  //* 이 useEffect가 무한 루프의 원인이었음

  //* ========================================
  //* 렌더링
  //* ========================================

  const hasNodes = getAllNodes().length > 0;

  return (
    <div
      className="flex-1 flex min-w-0 min-h-0 overflow-hidden w-full h-full"
      onDragEnd={handleDragEnd}
    >
      {/* 메인 에디터 영역 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden w-full h-full bg-gray-50 relative">
        {/* 영역별 배치 */}
        <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
          {/* Trigger 영역 - 컴팩트하게 */}
          <div className="w-full">
            <DropArea
              areaKey="trigger"
              title="Trigger"
              nodes={areaNodes.trigger}
              maxItems={1}
              onNodeSelect={handleNodeSelect}
              onNodeDragStart={handleNodeDragStart}
              onNodeDrag={handleNodeDrag}
              onDragOver={handleDragOver}
              onDrop={handleAreaDrop}
              onDragLeave={handleDragLeave}
              onJobDragOver={handleJobDragOver}
              onJobStepDrop={handleJobStepDrop}
              onJobDragLeave={handleJobDragLeave}
              getDragOverStyle={getDragOverStyle}
              getStepsByJob={getStepsByJob}
              renderEmptyState={renderEmptyState}
              dragOverArea={dragOverArea}
              dragOverJobId={dragOverJobId}
            />
          </div>

          {/* Job 영역 - 여러 개 허용 */}
          <div className="w-full">
            <DropArea
              areaKey="job"
              title="Job"
              nodes={areaNodes.job}
              onNodeSelect={handleNodeSelect}
              onNodeDragStart={handleNodeDragStart}
              onNodeDrag={handleNodeDrag}
              onDragOver={handleDragOver}
              onDrop={handleAreaDrop}
              onDragLeave={handleDragLeave}
              onJobDragOver={handleJobDragOver}
              onJobStepDrop={handleJobStepDrop}
              onJobDragLeave={handleJobDragLeave}
              getDragOverStyle={getDragOverStyle}
              getStepsByJob={getStepsByJob}
              renderEmptyState={renderEmptyState}
              dragOverArea={dragOverArea}
              dragOverJobId={dragOverJobId}
            />
          </div>
        </div>

        {/* 플로팅 액션 버튼 (FAB) - 노드가 있을 때만 표시 */}
        {hasNodes && (
          <div className="absolute bottom-6 right-6 z-20">
            <button
              onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            >
              {isControlPanelOpen ? <X size={24} /> : <Save size={24} />}
            </button>
          </div>
        )}

        {/* 컨트롤 패널 */}
        <ControlPanel
          isOpen={isControlPanelOpen}
          onClose={() => setIsControlPanelOpen(false)}
          selectedNode={selectedNode}
          onSaveWorkflow={handleSaveWorkflow}
          onClearWorkspace={handleClearWorkspace}
          onNodeSelect={handleNodeSelect}
          onNodeEdit={handleNodeEdit}
          onNodeDelete={handleNodeDelete}
          hasNodes={hasNodes}
        />
      </div>

      {/* 노드 편집기 */}
      {editingNode && (
        <ErrorBoundary>
          <NodeEditor
            nodeData={editingNode.data}
            nodeType={editingNode.type}
            onSave={handleNodeEditSave}
            onCancel={handleNodeEditCancel}
          />
        </ErrorBoundary>
      )}

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
        closeButton={false}
        limit={3}
      />
    </div>
  );
};
