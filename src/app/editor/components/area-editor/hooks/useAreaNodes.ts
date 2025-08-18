import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ServerBlock, WorkflowNodeData } from '../../../types';
import type { AreaNodeData, AreaNodes, NodeType } from '../types';
import { convertNodesToServerBlocks } from '../../../utils/dataConverter';

// * 깊은 비교 유틸리티 함수
const deepCompare = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepCompare(item, b[index]));
    }

    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      deepCompare(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
};

// * 영역별 노드 상태 관리 훅
// * @param initialBlocks 최초 마운트 시에만 areaNodes 초기화에 사용
// * @param onWorkflowChange 노드 변경 시 호출할 콜백
export const useAreaNodes = (
  initialBlocks?: ServerBlock[],
  onWorkflowChange?: (blocks: ServerBlock[]) => void,
) => {
  // 최초 마운트 시에만 초기화
  const buildAreaNodesFromBlocks = useCallback((blocks?: ServerBlock[]): AreaNodes => {
    if (!blocks) return { trigger: [], job: [], step: [] };
    const trigger: AreaNodeData[] = [];
    const job: AreaNodeData[] = [];
    const step: AreaNodeData[] = [];
    const jobNameToNodeId = new Map<string, string>();

    blocks.forEach((block, idx) => {
      if (block.type === 'trigger' || block.type === 'job') {
        const nodeId = uuidv4();
        const jobName =
          block['jobName'] || (block.type === 'job' ? `job${job.length + 1}` : '');
        const node: AreaNodeData = {
          id: nodeId,
          type: block.type === 'trigger' ? 'workflowTrigger' : 'job',
          data: {
            label: block.name,
            type: block.type === 'trigger' ? 'workflow_trigger' : 'job',
            description: block.description,
            jobName,
            domain: block.domain,
            task: block.task,
            config: block.config,
          },
          order: idx,
          parentId: undefined,
          isSelected: false,
          isEditing: false,
        };
        if (block.type === 'trigger') {
          trigger.push(node);
        } else {
          job.push(node);
          if (jobName) jobNameToNodeId.set(jobName, nodeId);
        }
      }
    });

    blocks.forEach((block, idx) => {
      if (block.type === 'step') {
        const nodeId = uuidv4();
        const parentJobName = block['jobName'] || '';
        const parentId = parentJobName ? jobNameToNodeId.get(parentJobName) : undefined;
        const node: AreaNodeData = {
          id: nodeId,
          type: 'step',
          data: {
            label: block.name,
            type: 'step',
            description: block.description,
            jobName: parentJobName,
            domain: block.domain,
            task: block.task,
            config: block.config,
          },
          order: idx,
          parentId,
          isSelected: false,
          isEditing: false,
        };
        step.push(node);
      }
    });

    return { trigger, job, step };
  }, []);

  const [areaNodes, setAreaNodes] = useState<AreaNodes>(() =>
    buildAreaNodesFromBlocks(initialBlocks),
  );

  // * 모든 노드 가져오기
  const getAllNodes = useCallback(() => {
    return [...areaNodes.trigger, ...areaNodes.job, ...areaNodes.step];
  }, [areaNodes.trigger, areaNodes.job, areaNodes.step]);

  // * ServerBlock 배열로 변환 (순서 보존)
  const getServerBlocks = useCallback(() => {
    const allNodes = getAllNodes();
    return convertNodesToServerBlocks(
      allNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: 0, y: 0 },
        data: n.data as unknown as Record<string, unknown>,
      })),
    );
  }, [getAllNodes]);

  // * 사용자가 배치한 순서대로 ServerBlock 배열로 변환 (jobName 기준 그룹화)
  const getServerBlocksInOrder = useCallback(() => {
    // 모든 노드를 하나의 배열로 합치기
    const allNodes = [...areaNodes.trigger, ...areaNodes.job, ...areaNodes.step];

    // order 속성을 기준으로 정렬 (사용자가 워크스페이스에서 배치한 순서)
    const sortedNodes = allNodes.sort((a, b) => a.order - b.order);

    // jobName을 기준으로 그룹화
    const groupedBlocks: ServerBlock[] = [];

    // trigger는 먼저 추가
    const triggerNodes = sortedNodes.filter((node) => node.type === 'workflowTrigger');
    groupedBlocks.push(
      ...triggerNodes.map((node) => ({
        name: node.data.label,
        type: 'trigger' as const,
        description: node.data.description,
        jobName: node.data.jobName,
        domain: node.data.domain,
        task: node.data.task,
        config: node.data.config,
      })),
    );

    // job과 관련 step들을 jobName 기준으로 그룹화
    const jobNodes = sortedNodes.filter((node) => node.type === 'job');

    jobNodes.forEach((jobNode) => {
      const jobName = jobNode.data.jobName;

      // 해당 jobName을 가진 step들 찾기
      const relatedSteps = sortedNodes.filter(
        (node) => node.type === 'step' && node.data.jobName === jobName,
      );

      // step들을 config.steps 배열로 변환
      const stepsConfig = relatedSteps.map((stepNode) => ({
        name: stepNode.data.label,
        ...stepNode.data.config,
      }));

      // job 노드 추가 (config에 steps 포함)
      groupedBlocks.push({
        name: jobNode.data.label,
        type: 'job' as const,
        description: jobNode.data.description,
        jobName,
        domain: jobNode.data.domain,
        task: jobNode.data.task,
        config: {
          ...jobNode.data.config,
          steps: stepsConfig,
        },
      });
    });

    return groupedBlocks;
  }, [areaNodes.trigger, areaNodes.job, areaNodes.step]);

  // initialBlocks 변경 시 워크스페이스를 재구성 (편집 페이지에서 비동기 로드 반영)
  // 깊은 비교를 통해 실제 내용이 변경된 경우에만 재초기화
  useEffect(() => {
    // initialBlocks가 없으면 초기화하지 않음
    if (!initialBlocks) return;

    const currentBlocks = getServerBlocksInOrder();
    // 간단한 비교로 변경: 길이와 첫 번째 블록의 id만 비교
    const shouldReinitialize =
      currentBlocks.length !== initialBlocks.length ||
      (currentBlocks.length > 0 &&
        initialBlocks.length > 0 &&
        currentBlocks[0]?.id !== initialBlocks[0]?.id);

    if (shouldReinitialize) {
      setAreaNodes(buildAreaNodesFromBlocks(initialBlocks));
    }
  }, [initialBlocks, buildAreaNodesFromBlocks]);

  //* onWorkflowChange 호출을 위한 상태
  const [pendingWorkflowChange, setPendingWorkflowChange] = useState<
    ServerBlock[] | null
  >(null);

  //* pendingWorkflowChange가 있을 때 onWorkflowChange 호출
  useEffect(() => {
    if (pendingWorkflowChange && onWorkflowChange) {
      onWorkflowChange(pendingWorkflowChange);
      setPendingWorkflowChange(null);
    }
  }, [pendingWorkflowChange, onWorkflowChange]);

  //* 워크플로우 변경을 지연시키는 함수
  const scheduleWorkflowChange = useCallback(
    (blocks: ServerBlock[]) => {
      setPendingWorkflowChange(blocks);
    },
    [onWorkflowChange],
  );

  // * Job 이름 자동 생성
  const generateJobName = useCallback((jobIndex: number) => {
    return `job${jobIndex + 1}`; // 하이픈 제거하여 통일
  }, []);

  // * 노드 생성
  const createNode = useCallback(
    (nodeType: NodeType, nodeData: WorkflowNodeData, parentId?: string): AreaNodeData => {
      //* Job인 경우 jobName 처리 및 config 업데이트
      if (nodeType === 'job') {
        //* 파이프라인에서 전달된 jobName이 있으면 사용, 없으면 자동 생성
        if (!nodeData.jobName) {
          const jobIndex = areaNodes.job.length;
          const jobName = generateJobName(jobIndex);
          nodeData.jobName = jobName;
        }

        //* config에서 jobs 객체를 제거하고 직접 job 속성들을 config에 설정
        //* 이렇게 하면 job의 config가 올바른 GitHub Actions YAML 구조를 가짐
        if (nodeData.config && nodeData.config.jobs) {
          const jobConfig = Object.values(nodeData.config.jobs)[0] as Record<
            string,
            unknown
          >;
          // jobs 객체를 제거하고 job 속성들을 직접 config에 설정
          const { jobs, ...restConfig } = nodeData.config;
          nodeData.config = {
            ...restConfig,
            ...jobConfig, // job의 실제 속성들 (runs-on, steps 등)을 config에 직접 설정
          };
        }
      }

      return {
        id: uuidv4(),
        type: nodeType,
        data: nodeData,
        order: 0,
        parentId,
        isSelected: false,
        isEditing: false,
      };
    },
    [areaNodes.job.length, generateJobName],
  );

  // * 노드 추가
  const addNode = useCallback(
    (nodeType: NodeType, nodeData: WorkflowNodeData, parentId?: string) => {
      //* Trigger는 기존 블록을 교체
      if (nodeType === 'workflowTrigger' && areaNodes.trigger.length > 0) {
        //* 기존 Trigger를 새로운 Trigger로 교체
        setAreaNodes((prev) => {
          const newTrigger = createNode(nodeType, nodeData, parentId);

          const newAreaNodes = {
            ...prev,
            trigger: [{ ...newTrigger, order: 0 }], //* Trigger는 항상 첫 번째
          };

          //* 노드 교체 후 워크플로우 변경 스케줄링
          const allNodes = [
            ...newAreaNodes.trigger,
            ...newAreaNodes.job,
            ...newAreaNodes.step,
          ];
          const blocks = convertNodesToServerBlocks(
            allNodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: { x: 0, y: 0 },
              data: n.data as unknown as Record<string, unknown>,
            })),
          );
          scheduleWorkflowChange(blocks);

          return newAreaNodes;
        });
        return;
      }

      const newNode = createNode(nodeType, nodeData, parentId);

      setAreaNodes((prev) => {
        const areaKey =
          nodeType === 'workflowTrigger'
            ? 'trigger'
            : nodeType === 'job'
              ? 'job'
              : 'step';
        const currentNodes = prev[areaKey];
        const newOrder = currentNodes.length;

        const newAreaNodes = {
          ...prev,
          [areaKey]: [...currentNodes, { ...newNode, order: newOrder }],
        };

        //* 노드 추가 후 워크플로우 변경 스케줄링
        const allNodes = [
          ...newAreaNodes.trigger,
          ...newAreaNodes.job,
          ...newAreaNodes.step,
        ];
        const blocks = convertNodesToServerBlocks(
          allNodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: { x: 0, y: 0 },
            data: n.data as unknown as Record<string, unknown>,
          })),
        );
        scheduleWorkflowChange(blocks);

        return newAreaNodes;
      });

      return newNode;
    },
    [areaNodes.trigger.length, createNode, scheduleWorkflowChange],
  );

  // * 노드 삭제
  const deleteNode = useCallback(
    (nodeId: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        //* 삭제할 노드가 Job인지 확인
        const deletedJob = prev.job.find((job) => job.id === nodeId);

        //* 각 영역에서 노드 찾아서 삭제
        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].filter((n) => n.id !== nodeId);

          //* Job 영역의 경우 순서 재정렬 및 jobName 업데이트
          if (area === 'job') {
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => {
              const newJobName = generateJobName(index);
              const jobConfig = Object.values(node.data.config?.jobs || {})[0];
              return {
                ...node,
                order: index,
                data: {
                  ...node.data,
                  jobName: newJobName,
                  config: {
                    ...node.data.config,
                    jobs: {
                      [newJobName as string]: jobConfig,
                    },
                  },
                },
              };
            });
          } else {
            //* 다른 영역은 순서만 재정렬
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => ({
              ...node,
              order: index,
            }));
          }
        });

        //* Job이 삭제된 경우 하위 Step들도 삭제하고, 남은 Job들의 하위 Step들의 jobName 업데이트
        if (deletedJob) {
          //* 삭제된 Job의 하위 Step들 제거
          newAreaNodes.step = newAreaNodes.step.filter(
            (step) => step.parentId !== nodeId,
          );

          //* 남은 Job들의 하위 Step들의 jobName 업데이트
          newAreaNodes.step = newAreaNodes.step.map((step) => {
            const parentJob = newAreaNodes.job.find((job) => job.id === step.parentId);
            if (parentJob) {
              return {
                ...step,
                data: {
                  ...step.data,
                  jobName: parentJob.data.jobName,
                },
              };
            }
            return step;
          });
        }

        //* 노드 삭제 후 워크플로우 변경 스케줄링
        const allNodes = [
          ...newAreaNodes.trigger,
          ...newAreaNodes.job,
          ...newAreaNodes.step,
        ];
        const blocks = convertNodesToServerBlocks(
          allNodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: { x: 0, y: 0 },
            data: n.data as unknown as Record<string, unknown>,
          })),
        );
        scheduleWorkflowChange(blocks);

        return newAreaNodes;
      });
    },
    [generateJobName, scheduleWorkflowChange],
  );

  // * 노드 업데이트
  const updateNode = useCallback(
    (
      nodeId: string,
      updates: Partial<AreaNodeData>,
      skipWorkflowChange: boolean = false,
    ) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node,
          );
        });

        //* 편집 모드 상태 변경이 아닌 경우에만 워크플로우 변경 스케줄링
        if (!skipWorkflowChange) {
          const allNodes = [
            ...newAreaNodes.trigger,
            ...newAreaNodes.job,
            ...newAreaNodes.step,
          ];
          const blocks = convertNodesToServerBlocks(
            allNodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: { x: 0, y: 0 },
              data: n.data as unknown as Record<string, unknown>,
            })),
          );
          scheduleWorkflowChange(blocks);
        }

        return newAreaNodes;
      });
    },
    [onWorkflowChange],
  );

  // * 노드 데이터 업데이트
  const updateNodeData = useCallback(
    (nodeId: string, data: WorkflowNodeData) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        //* 업데이트할 노드 찾기 (Job 노드인지 확인)
        const targetJob = newAreaNodes.job.find((n) => n.id === nodeId);
        const isJobNode = targetJob !== undefined;
        const oldJobName = targetJob?.data.jobName;

        //* 노드 데이터 업데이트
        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].map((node) =>
            node.id === nodeId ? { ...node, data } : node,
          );
        });

        //* Job 노드의 jobName이 변경된 경우 관련 Step들 업데이트
        if (isJobNode && oldJobName && oldJobName !== data.jobName) {
          const newJobName = data.jobName;

          //* Job 노드의 config 업데이트
          newAreaNodes.job = newAreaNodes.job.map((job) => {
            if (job.id === nodeId) {
              const jobConfig = Object.values(job.data.config?.jobs || {})[0];
              return {
                ...job,
                data: {
                  ...job.data,
                  jobName: newJobName,
                  config: {
                    ...job.data.config,
                    jobs: {
                      [newJobName as string]: jobConfig,
                    },
                  },
                },
              };
            }
            return job;
          });

          //* 해당 jobName을 참조하는 모든 Step들의 jobName 업데이트
          newAreaNodes.step = newAreaNodes.step.map((step) => {
            if (step.data.jobName === oldJobName) {
              return {
                ...step,
                data: {
                  ...step.data,
                  jobName: newJobName,
                },
              };
            }
            return step;
          });
        }

        //* 노드 데이터 업데이트 후 워크플로우 변경 스케줄링
        const allNodes = [
          ...newAreaNodes.trigger,
          ...newAreaNodes.job,
          ...newAreaNodes.step,
        ];
        const blocks = convertNodesToServerBlocks(
          allNodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: { x: 0, y: 0 },
            data: n.data as unknown as Record<string, unknown>,
          })),
        );
        scheduleWorkflowChange(blocks);

        return newAreaNodes;
      });
    },
    [scheduleWorkflowChange],
  );

  // * 워크스페이스 초기화
  const clearWorkspace = useCallback(() => {
    setAreaNodes({
      trigger: [],
      job: [],
      step: [],
    });
  }, []);

  // * Job의 jobName 변경 시 하위 Step들의 jobName도 업데이트
  const updateStepJobNames = useCallback((jobId: string, newJobName: string) => {
    setAreaNodes((prev) => {
      const newAreaNodes = { ...prev };

      //* 해당 Job을 찾아서 기존 jobName 확인
      const targetJob = newAreaNodes.job.find((job) => job.id === jobId);
      if (!targetJob) return prev;

      const oldJobName = targetJob.data.jobName;

      //* 해당 jobName을 참조하는 모든 Step들의 jobName 업데이트
      newAreaNodes.step = newAreaNodes.step.map((step) => {
        if (step.data.jobName === oldJobName) {
          return {
            ...step,
            data: {
              ...step.data,
              jobName: newJobName,
            },
          };
        }
        return step;
      });

      return newAreaNodes;
    });
  }, []);

  return {
    areaNodes,
    addNode,
    deleteNode,
    updateNode,
    updateNodeData,
    getAllNodes,
    getServerBlocks,
    getServerBlocksInOrder,
    clearWorkspace,
    updateStepJobNames,
  };
};
