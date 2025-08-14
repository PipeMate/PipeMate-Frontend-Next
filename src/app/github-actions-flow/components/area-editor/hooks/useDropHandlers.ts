import { useCallback, useRef, useState } from 'react';
import { ServerBlock, WorkflowNodeData } from '../../../types';
import { AreaNodes, NodeType } from '../types';
import { toast } from 'react-toastify';

// * 드롭 핸들러 관리 훅
// * 강화된 유효성 검사 및 순서 제약 포함
export const useDropHandlers = (
  areaNodes: AreaNodes,
  addNode: (nodeType: NodeType, nodeData: WorkflowNodeData, parentId?: string) => void,
  clearDragState?: () => void,
) => {
  //* 드래그 오버 상태 관리
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);

  //* 중복 토스트 방지를 위한 디바운싱
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'error' | 'success' = 'error') => {
      const now = Date.now();
      const lastToast = lastToastRef.current;

      //* 같은 메시지가 1초 내에 다시 호출되면 무시
      if (
        lastToast &&
        lastToast.message === message &&
        now - lastToast.timestamp < 1000
      ) {
        return;
      }

      lastToastRef.current = { message, timestamp: now };

      if (type === 'error') {
        toast.error(message);
      } else {
        toast.success(message);
      }
    },
    [],
  );

  //* 드래그 오버 핸들러들
  const handleDragOver = useCallback((e: React.DragEvent, areaKey: string) => {
    e.preventDefault();
    setDragOverArea(areaKey);
  }, []);

  const handleJobDragOver = useCallback((e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverJobId(jobId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, areaKey: string) => {
    e.preventDefault();
    setDragOverArea(null);
  }, []);

  const handleJobDragLeave = useCallback((e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverJobId(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragOverArea(null);
    setDragOverJobId(null);
    clearDragState?.();
  }, [clearDragState]);

  const getDragOverStyle = useCallback(
    (areaKey: string, isJobStep: boolean = false, jobId?: string) => {
      if (isJobStep && jobId) {
        return dragOverJobId === jobId
          ? 'border-orange-500 bg-orange-100/80 border-solid ring-2 ring-orange-300'
          : '';
      }

      if (dragOverArea === areaKey) {
        switch (areaKey) {
          case 'trigger':
            return 'border-green-500 bg-green-100/80 border-solid ring-2 ring-green-300';
          case 'job':
            return 'border-blue-500 bg-blue-100/80 border-solid ring-2 ring-blue-300';
          case 'step':
            return 'border-yellow-500 bg-yellow-100/80 border-solid ring-2 ring-yellow-300';
          default:
            return 'border-gray-500 bg-gray-100/80 border-solid ring-2 ring-gray-300';
        }
      }
      return '';
    },
    [dragOverArea, dragOverJobId],
  );

  //* ========================================
  //* 유효성 검사 함수들
  //* ========================================

  // * 블록 타입별 허용 영역 검사
  const validateBlockDrop = useCallback(
    (block: ServerBlock, targetArea: keyof AreaNodes) => {
      const blockType = block.type;

      switch (targetArea) {
        case 'trigger':
          if (blockType !== 'trigger') {
            showToast('Trigger 영역에는 Trigger 블록만 드롭할 수 있습니다.');
            return false;
          }
          //* Trigger는 기존 블록을 교체하도록 허용 (중복 검사 제거)
          break;

        case 'job':
          if (blockType === 'trigger') {
            showToast('Job 영역에는 Trigger 블록을 드롭할 수 없습니다.');
            return false;
          }
          //* Job은 복수 생성 가능 (중복 검사 제거)
          break;

        case 'step':
          if (blockType !== 'step') {
            showToast('Step 영역에는 Step 블록만 드롭할 수 있습니다.');
            return false;
          }
          //* Step은 중복 가능 (중복 검사 제거)
          break;
      }

      return true;
    },
    [showToast],
  );

  // * 순서 제약 검사
  const validateOrderConstraints = useCallback(
    (block: ServerBlock, targetArea: keyof AreaNodes) => {
      const blockType = block.type;

      //* Trigger가 없으면 다른 블록들을 드롭할 수 없음
      if (blockType !== 'trigger' && areaNodes.trigger.length === 0) {
        showToast('먼저 Trigger 블록을 추가해주세요.');
        return false;
      }

      //* Job이 없으면 Step을 드롭할 수 없음
      if (blockType === 'step' && areaNodes.job.length === 0) {
        showToast('먼저 Job 블록을 추가해주세요.');
        return false;
      }

      return true;
    },
    [areaNodes.trigger.length, areaNodes.job.length, showToast],
  );

  // * 중복 검사 (Trigger만 적용)
  const validateDuplicates = useCallback(
    (block: ServerBlock, targetArea: keyof AreaNodes) => {
      const blockType = block.type;

      //* Trigger만 중복 검사 적용 (기존 블록 교체)
      if (blockType === 'trigger' && targetArea === 'trigger') {
        const existingNodes = areaNodes.trigger;
        const isDuplicate = existingNodes.some((node) => node.data.label === block.name);

        if (isDuplicate) {
          //* 중복된 Trigger는 기존 블록을 교체하도록 허용
          return true; //* 교체 로직은 addNode에서 처리
        }
      }

      //* Job과 Step은 중복 허용
      return true;
    },
    [areaNodes.trigger, showToast],
  );

  // * 종합 유효성 검사
  const performValidation = useCallback(
    (block: ServerBlock, targetArea: keyof AreaNodes) => {
      return (
        validateBlockDrop(block, targetArea) &&
        validateOrderConstraints(block, targetArea) &&
        validateDuplicates(block, targetArea)
      );
    },
    [validateBlockDrop, validateOrderConstraints, validateDuplicates],
  );

  // * 드롭 이벤트 핸들러
  // * 블록을 특정 영역에 드롭했을 때 호출됩니다.
  const handleDrop = useCallback(
    (e: React.DragEvent, targetArea: keyof AreaNodes) => {
      e.preventDefault();
      e.stopPropagation(); //* 이벤트 버블링 방지

      //* 드래그 상태 초기화
      clearDragState?.();

      try {
        const data = e.dataTransfer.getData('application/reactflow');
        if (!data) {
          console.warn('드롭 데이터가 없습니다.');
          return;
        }

        const blockData = JSON.parse(data);

        //* 파이프라인 드롭 처리
        if (blockData.type === 'pipeline') {
          const pipeline = blockData.pipeline;
          const blocks = blockData.blocks;

          //* 파이프라인 유효성 검사
          if (!blocks || !Array.isArray(blocks)) {
            showToast('잘못된 파이프라인 데이터입니다.');
            return;
          }

          //* 파이프라인 블록들을 순서대로 추가
          blocks.forEach((block: ServerBlock) => {
            const nodeType =
              block.type === 'trigger'
                ? 'workflowTrigger'
                : block.type === 'job'
                ? 'job'
                : 'step';

            //* 각 블록에 대해 유효성 검사 수행
            if (!performValidation(block, targetArea)) {
              return; //* 유효성 검사 실패 시 해당 블록 건너뛰기
            }

            const nodeData: WorkflowNodeData = {
              label: block.name,
              type:
                block.type === 'trigger'
                  ? 'workflow_trigger'
                  : (block.type as 'workflow_trigger' | 'job' | 'step'),
              description: block.description,
              jobName: block['job-name'] || '',
              domain: block.domain,
              task: block.task,
              config: block.config,
            };

            //* Step을 Job 영역에 드롭한 경우, 가장 가까운 Job을 부모로 설정
            let parentId: string | undefined;
            if (nodeType === 'step' && targetArea === 'job') {
              const jobNodes = areaNodes.job;
              if (jobNodes.length > 0) {
                const parentJob = jobNodes[jobNodes.length - 1];
                parentId = parentJob.id;
                nodeData.jobName = parentJob.data.jobName || '';
              }
            }

            addNode(nodeType as NodeType, nodeData, parentId);
          });

          showToast('파이프라인이 성공적으로 추가되었습니다.', 'success');
          return;
        }

        //* 개별 블록 드롭 처리
        const block: ServerBlock = blockData;

        //* 종합 유효성 검사 수행
        if (!performValidation(block, targetArea)) {
          return;
        }

        const nodeType =
          block.type === 'trigger'
            ? 'workflowTrigger'
            : block.type === 'job'
            ? 'job'
            : 'step';

        const nodeData: WorkflowNodeData = {
          label: block.name,
          type:
            block.type === 'trigger'
              ? 'workflow_trigger'
              : (block.type as 'workflow_trigger' | 'job' | 'step'),
          description: block.description,
          jobName: block['job-name'] || '',
          domain: block.domain,
          task: block.task,
          config: block.config,
        };

        //* Step을 Job 영역에 드롭한 경우, 가장 가까운 Job을 부모로 설정
        let parentId: string | undefined;
        if (nodeType === 'step' && targetArea === 'job') {
          const jobNodes = areaNodes.job;
          if (jobNodes.length > 0) {
            const parentJob = jobNodes[jobNodes.length - 1];
            parentId = parentJob.id;
            nodeData.jobName = parentJob.data.jobName || '';
          }
        }

        addNode(nodeType as NodeType, nodeData, parentId);
        showToast(`'${block.name}' 블록이 추가되었습니다.`, 'success');
      } catch (error) {
        console.error('드롭 처리 오류:', error);
        showToast('드롭 처리 중 오류가 발생했습니다.', 'error');
      }
    },
    [addNode, areaNodes.job, performValidation, clearDragState, showToast],
  );

  // * 드롭 핸들러 - 영역별
  const handleAreaDrop = useCallback(
    (e: React.DragEvent, areaKey: keyof AreaNodes) => {
      e.preventDefault();
      e.stopPropagation(); //* 이벤트 버블링 방지

      //* 드래그 상태 초기화
      clearDragState?.();

      //* 블록 라이브러리에서 드롭된 경우
      if (e.dataTransfer.types.includes('application/reactflow')) {
        const blockData = JSON.parse(e.dataTransfer.getData('application/reactflow'));

        //* 파이프라인 드롭인 경우 handleDrop으로 위임
        if (blockData.type === 'pipeline') {
          handleDrop(e, areaKey);
          return;
        }

        //* 개별 블록인 경우
        const block: ServerBlock = blockData;

        //* 종합 유효성 검사 수행
        if (!performValidation(block, areaKey)) {
          return;
        }

        const nodeType =
          block.type === 'trigger'
            ? 'workflowTrigger'
            : block.type === 'job'
            ? 'job'
            : 'step';

        const nodeData: WorkflowNodeData = {
          label: block.name,
          type:
            block.type === 'trigger'
              ? 'workflow_trigger'
              : (block.type as 'workflow_trigger' | 'job' | 'step'),
          description: block.description,
          jobName: block['job-name'] || '',
          domain: block.domain,
          task: block.task,
          config: block.config,
        };

        //* Step 블록을 Job 영역에 드롭한 경우, 가장 최근 Job의 내부로 리다이렉트
        if (block.type === 'step' && areaKey === 'job') {
          const jobNodes = areaNodes.job;
          if (jobNodes.length > 0) {
            const parentJob = jobNodes[jobNodes.length - 1];
            nodeData.jobName = parentJob.data.jobName || ''; // 해당 Job의 이름 사용
            addNode('step', nodeData, parentJob.id);
            showToast(`'${block.name}' Step이 Job에 추가되었습니다.`, 'success');
            return;
          }
        }

        addNode(nodeType as NodeType, nodeData);
        showToast(`'${block.name}' 블록이 추가되었습니다.`, 'success');
      }
    },
    [addNode, areaNodes.job, handleDrop, performValidation, clearDragState, showToast],
  );

  // * 드롭 핸들러 - Job 내부 Step 영역
  const handleJobStepDrop = useCallback(
    (e: React.DragEvent, jobId: string) => {
      e.preventDefault();
      e.stopPropagation(); //* 이벤트 버블링 방지

      //* 드래그 상태 초기화
      clearDragState?.();

      //* 블록 라이브러리에서 드롭된 경우
      if (e.dataTransfer.types.includes('application/reactflow')) {
        const blockData = JSON.parse(e.dataTransfer.getData('application/reactflow'));

        //* 파이프라인 드롭인 경우 handleDrop으로 위임
        if (blockData.type === 'pipeline') {
          handleDrop(e, 'job');
          return;
        }

        //* Step 블록만 Job 내부에 드롭 가능
        if (blockData.type === 'step') {
          const block: ServerBlock = blockData;

          //* Step 블록 유효성 검사
          if (!validateBlockDrop(block, 'step')) {
            return;
          }

          //* 해당 Job의 이름을 찾아서 Step의 jobName으로 설정
          const parentJob = areaNodes.job.find((job) => job.id === jobId);
          if (!parentJob) {
            showToast('부모 Job을 찾을 수 없습니다.');
            return;
          }

          const jobName = parentJob.data.jobName || block['job-name'] || '';

          const nodeData: WorkflowNodeData = {
            label: block.name,
            type: 'step',
            description: block.description,
            jobName: jobName,
            domain: block.domain,
            task: block.task,
            config: block.config,
          };

          addNode('step', nodeData, jobId);
          showToast(`'${block.name}' Step이 Job에 추가되었습니다.`, 'success');
        } else {
          showToast('Step 블록만 Job 내부에 드롭할 수 있습니다.', 'error');
        }
      }
    },
    [addNode, areaNodes.job, handleDrop, validateBlockDrop, clearDragState, showToast],
  );

  return {
    handleDrop,
    handleAreaDrop,
    handleJobStepDrop,
    validateBlockDrop,
    validateOrderConstraints,
    validateDuplicates,
    performValidation,
    dragOverArea,
    dragOverJobId,
    handleDragOver,
    handleJobDragOver,
    handleDragLeave,
    handleJobDragLeave,
    handleDragEnd,
    getDragOverStyle,
  };
};
