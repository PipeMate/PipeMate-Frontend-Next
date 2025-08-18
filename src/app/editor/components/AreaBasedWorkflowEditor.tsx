'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { ServerBlock } from '../types';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RotateCcw, Settings } from 'lucide-react';

//* 새로운 구조의 컴포넌트들과 훅들 import
import type {
  AreaBasedWorkflowEditorProps,
  AreaNodeData,
  AreaNodes,
} from './area-editor/types';
import { useAreaNodes } from './area-editor/hooks/useAreaNodes';

import { useDropHandlers } from './area-editor/hooks/useDropHandlers';
import { IntegratedSidePanel } from './IntegratedSidePanel';
import { DropArea } from './area-editor/components/DropArea';
import { EmptyState } from './area-editor/components/EmptyState';

// * ========================================
// * 영역 기반 워크플로우 에디터 컴포넌트
// * ========================================
// *
// * 드래그 앤 드롭으로 블록을 추가하고, 영역별로 워크플로우를 구성하는 에디터입니다.
// * Trigger, Job, Step 영역으로 나누어져 있으며, 각 영역에 맞는 블록을 배치할 수 있습니다.
export const AreaBasedWorkflowEditor: React.FC<AreaBasedWorkflowEditorProps> = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
  onEditModeToggle,
  isEditing,
  onBlockUpdate,
  mode = 'create',
  initialWorkflowName,
  onWorkflowNameChange,
}) => {
  //* ========================================
  //* 커스텀 훅 사용
  //* ========================================

  const {
    areaNodes,
    addNode,
    deleteNode,
    updateNodeData,
    getServerBlocksInOrder,
    clearWorkspace,
  } = useAreaNodes(initialBlocks, onWorkflowChange);

  const {
    handleAreaDrop,
    handleJobStepDrop,
    dragOverArea,
    dragOverJobId,
    handleDragOver,
    handleJobDragOver,
    handleDragLeave,
    handleJobDragLeave,
    getDragOverStyle,
  } = useDropHandlers(areaNodes, addNode);

  //* ========================================
  //* 상태 관리
  //* ========================================

  //* 선택된 노드 상태
  const [selectedNode, setSelectedNode] = useState<AreaNodeData | null>(null);

  //* 워크플로우 이름 상태
  const [workflowName, setWorkflowName] = useState<string>(
    initialWorkflowName || `workflow-${new Date().toISOString().slice(0, 10)}`,
  );

  //* 워크플로우 이름 변경 핸들러
  const handleWorkflowNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setWorkflowName(newName);
      if (onWorkflowNameChange) {
        onWorkflowNameChange(newName);
      }
    },
    [onWorkflowNameChange],
  );

  //* initialWorkflowName이 변경되면 워크플로우 이름 업데이트
  useEffect(() => {
    if (initialWorkflowName) {
      setWorkflowName(initialWorkflowName);
    }
  }, [initialWorkflowName]);

  //* 글로벌 레이아웃 사이드바 주입 제거: 라이브러리는 에디터 우측 컬럼에 직접 렌더링

  //* ========================================
  //* 이벤트 핸들러
  //* ========================================

  // * 노드 선택 핸들러
  // * 사용자가 노드를 클릭했을 때 호출
  const handleNodeSelect = useCallback(
    (node: AreaNodeData) => {
      setSelectedNode(node);

      if (onNodeSelect) {
        const selectedBlock: ServerBlock = {
          name: node.data.label,
          type:
            node.data.type === 'workflow_trigger'
              ? 'trigger'
              : (node.data.type as 'trigger' | 'job' | 'step'),
          description: node.data.description,
          jobName: node.data.jobName,
          config: node.data.config,
        };
        onNodeSelect(selectedBlock);
      }
    },
    [onNodeSelect],
  );

  // * 워크스페이스 클릭 핸들러
  // * 외부 클릭 시 선택된 노드 해제
  const handleWorkspaceClick = useCallback((e: React.MouseEvent) => {
    // 노드나 컨트롤 패널이 아닌 영역 클릭 시
    if (
      !(e.target as Element).closest('.area-node') &&
      !(e.target as Element).closest('[data-radix-popover-content]')
    ) {
      setSelectedNode(null);
    }
  }, []);

  // * 노드 삭제
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      // NodeEditor에서 이미 확인했으므로 바로 삭제
      deleteNode(nodeId);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
      toast.success('노드가 삭제되었습니다.');
    },
    [deleteNode, selectedNode],
  );

  // * 노드 편집 완료 핸들러
  const handleNodeEdit = useCallback(
    (updatedNode: AreaNodeData) => {
      // 선택된 노드가 업데이트된 노드와 같다면 선택된 노드 상태도 업데이트
      if (selectedNode?.id === updatedNode.id) {
        setSelectedNode(updatedNode);
      }
    },
    [selectedNode],
  );

  //* ========================================
  //* 유틸리티 함수
  //* ========================================

  // * Job별 Step 그룹핑
  const getStepsByJob = useCallback(() => {
    const jobSteps: Record<string, AreaNodeData[]> = {};

    areaNodes.job.forEach((job) => {
      jobSteps[job.id] = areaNodes.step.filter((step) => step.parentId === job.id);
    });

    return jobSteps;
  }, [areaNodes]);

  //* ========================================
  //* 기본 블록 생성 함수들
  //* ========================================

  // * 기본 Trigger 블록 생성
  const createDefaultTrigger = useCallback(() => {
    const triggerData = {
      label: '워크플로우 기본 설정',
      type: 'workflow_trigger' as const,
      description: 'GitHub Actions 워크플로우 트리거',
      config: {
        on: {
          workflow_dispatch: {},
          push: { branches: ['main'] },
        },
        name: 'CI',
      },
    };
    addNode('workflowTrigger', triggerData);
    toast.success('기본 Trigger 블록이 생성되었습니다.');
  }, [addNode]);

  // * 기본 Job 블록 생성
  const createDefaultJob = useCallback(() => {
    const jobIndex = areaNodes.job.length;
    const jobName = `job${jobIndex + 1}`;

    const jobData = {
      label: 'build-and-test',
      type: 'job' as const,
      description: '코드를 빌드하고 테스트를 실행',
      jobName,
      config: {
        'runs-on': 'ubuntu-latest',
      },
    };
    addNode('job', jobData);
    toast.success('기본 Job 블록이 생성되었습니다.');
  }, [addNode, areaNodes.job.length]);

  // * 기본 Step 블록 생성 (특정 Job에 추가)
  const createDefaultStep = useCallback(
    (jobId: string) => {
      const job = areaNodes.job.find((job) => job.id === jobId);
      const jobName = job?.data.jobName || 'unknown';

      const stepData = {
        label: 'checkout',
        type: 'step' as const,
        description: '저장소 코드를 체크아웃',
        jobName,
        config: {
          name: 'Checkout code',
          uses: 'actions/checkout@v4',
        },
      };
      addNode('step', stepData, jobId);
      toast.success('기본 Step 블록이 생성되었습니다.');
    },
    [addNode, areaNodes.job],
  );

  // * 영역별 기본 블록 생성 함수
  const createDefaultBlock = useCallback(
    (areaKey: keyof AreaNodes, jobId?: string) => {
      switch (areaKey) {
        case 'trigger':
          createDefaultTrigger();
          break;
        case 'job':
          createDefaultJob();
          break;
        case 'step':
          if (jobId) {
            createDefaultStep(jobId);
          }
          break;
      }
    },
    [createDefaultTrigger, createDefaultJob, createDefaultStep],
  );

  // * 빈 상태 렌더링
  const renderEmptyState = useCallback(
    (
      areaKey: keyof AreaNodes,
      title: string,
      isDragOver: boolean,
      isJobStep: boolean = false,
      jobId?: string,
    ) => {
      return (
        <EmptyState
          areaKey={areaKey}
          title={title}
          isDragOver={isDragOver}
          isJobStep={isJobStep}
          jobId={jobId}
          onCreateDefaultBlock={() => createDefaultBlock(areaKey, jobId)}
        />
      );
    },
    [createDefaultBlock],
  );

  // * 노드 드래그 시작 핸들러
  const handleNodeDragStart = useCallback((_node: AreaNodeData) => {
    // 드래그 시작 시 필요한 처리
  }, []);

  // * 노드 드래그 핸들러
  const handleNodeDrag = useCallback((e: React.DragEvent, _node: AreaNodeData) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

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

  return (
    <div
      className="flex-1 flex min-w-0 min-h-0 overflow-hidden w-full h-full relative"
      // onDragEnd={handleDragEnd} // This line was removed as per the edit hint
    >
      {/* 메인 에디터 영역 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-gray-50 relative">
        {/* 워크플로우 설정 (최상단) */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">워크플로우 설정</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">상태:</span>
              <span className="font-medium text-green-600">설정됨</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                value={workflowName}
                onChange={handleWorkflowNameChange}
                placeholder="워크플로우 이름"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={clearWorkspace}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-md flex items-center gap-2"
            >
              <RotateCcw size={14} />
              초기화
            </button>
          </div>
        </div>

        {/* 영역별 배치 */}
        <div
          className="flex-1 flex flex-col gap-6 p-6 overflow-auto transition-all duration-300"
          onClick={handleWorkspaceClick}
        >
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
              onAddBlock={createDefaultBlock}
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
              onAddBlock={createDefaultBlock}
            />
          </div>
        </div>
      </div>

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

      {/* 우측: 통합 패널 (블록 라이브러리 + 편집 + YAML + 시크릿) */}
      <div className="hidden md:block fixed top-16 right-0 w-80 xl:w-96 h-[calc(100vh-4rem)] border-l border-gray-200 bg-white overflow-hidden z-50">
        <IntegratedSidePanel
          selectedNode={selectedNode}
          blocks={getServerBlocksInOrder()}
          isOpen={true}
          onNodeEdit={handleNodeEdit}
          onNodeDelete={handleNodeDelete}
          updateNodeData={updateNodeData}
          mode={mode}
          initialWorkflowName={workflowName}
          onWorkflowNameChange={onWorkflowNameChange}
        />
      </div>
    </div>
  );
};
