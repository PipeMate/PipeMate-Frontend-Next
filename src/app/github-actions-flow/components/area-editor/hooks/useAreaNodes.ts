import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ServerBlock, WorkflowNodeData } from "../../../types";
import { AreaNodeData, AreaNodes, NodeType } from "../types";
import { convertNodesToServerBlocks } from "../../../utils/dataConverter";

/**
 * 영역별 노드 상태 관리 훅
 * @param initialBlocks 최초 마운트 시에만 areaNodes 초기화에 사용
 * @param onWorkflowChange 노드 변경 시 호출할 콜백
 */
export const useAreaNodes = (
  initialBlocks?: ServerBlock[],
  onWorkflowChange?: (blocks: ServerBlock[]) => void
) => {
  // 최초 마운트 시에만 초기화
  const [areaNodes, setAreaNodes] = useState<AreaNodes>(() => {
    if (!initialBlocks) {
      return { trigger: [], job: [], step: [] };
    }
    // ServerBlock[]을 AreaNodes로 변환
    const trigger: AreaNodeData[] = [];
    const job: AreaNodeData[] = [];
    const step: AreaNodeData[] = [];
    initialBlocks.forEach((block, idx) => {
      const node: AreaNodeData = {
        id: uuidv4(),
        type:
          block.type === "trigger"
            ? "workflowTrigger"
            : (block.type as NodeType),
        data: {
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
        },
        order: idx,
        parentId: undefined, // parent-id는 현재 사용하지 않으므로 undefined로 설정
        isSelected: false,
        isEditing: false,
      };
      if (block.type === "trigger") trigger.push(node);
      else if (block.type === "job") job.push(node);
      else if (block.type === "step") step.push(node);
    });
    return { trigger, job, step };
  });

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
    [onWorkflowChange]
  );

  /**
   * Job 이름 자동 생성
   */
  const generateJobName = useCallback((jobIndex: number) => {
    return `job${jobIndex + 1}`; // 하이픈 제거하여 통일
  }, []);

  /**
   * 노드 생성
   */
  const createNode = useCallback(
    (
      nodeType: NodeType,
      nodeData: WorkflowNodeData,
      parentId?: string
    ): AreaNodeData => {
      //* Job인 경우 job-name 자동 생성
      if (nodeType === "job") {
        const jobIndex = areaNodes.job.length;
        const jobName = generateJobName(jobIndex);
        nodeData.jobName = jobName;
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
    [areaNodes.job.length, generateJobName]
  );

  /**
   * 노드 추가
   */
  const addNode = useCallback(
    (nodeType: NodeType, nodeData: WorkflowNodeData, parentId?: string) => {
      //* 트리거는 하나만 허용
      if (nodeType === "workflowTrigger" && areaNodes.trigger.length > 0) {
        return;
      }

      const newNode = createNode(nodeType, nodeData, parentId);

      setAreaNodes((prev) => {
        const areaKey =
          nodeType === "workflowTrigger"
            ? "trigger"
            : nodeType === "job"
            ? "job"
            : "step";
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
          }))
        );
        scheduleWorkflowChange(blocks);

        return newAreaNodes;
      });

      return newNode;
    },
    [areaNodes.trigger.length, createNode, scheduleWorkflowChange]
  );

  /**
   * 노드 삭제
   */
  const deleteNode = useCallback(
    (nodeId: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        //* 삭제할 노드가 Job인지 확인
        const deletedJob = prev.job.find((job) => job.id === nodeId);

        //* 각 영역에서 노드 찾아서 삭제
        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].filter(
            (n) => n.id !== nodeId
          );

          //* Job 영역의 경우 순서 재정렬 및 job-name 업데이트
          if (area === "job") {
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => ({
              ...node,
              order: index,
              data: {
                ...node.data,
                jobName: generateJobName(index),
              },
            }));
          } else {
            //* 다른 영역은 순서만 재정렬
            newAreaNodes[area] = newAreaNodes[area].map((node, index) => ({
              ...node,
              order: index,
            }));
          }
        });

        //* Job이 삭제된 경우 하위 Step들도 삭제하고, 남은 Job들의 하위 Step들의 job-name 업데이트
        if (deletedJob) {
          //* 삭제된 Job의 하위 Step들 제거
          newAreaNodes.step = newAreaNodes.step.filter(
            (step) => step.parentId !== nodeId
          );

          //* 남은 Job들의 하위 Step들의 job-name 업데이트
          newAreaNodes.step = newAreaNodes.step.map((step) => {
            const parentJob = newAreaNodes.job.find(
              (job) => job.id === step.parentId
            );
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
          }))
        );
        scheduleWorkflowChange(blocks);

        return newAreaNodes;
      });
    },
    [generateJobName, scheduleWorkflowChange]
  );

  /**
   * 노드 업데이트
   */
  const updateNode = useCallback(
    (
      nodeId: string,
      updates: Partial<AreaNodeData>,
      skipWorkflowChange: boolean = false
    ) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
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
            }))
          );
          scheduleWorkflowChange(blocks);
        }

        return newAreaNodes;
      });
    },
    [onWorkflowChange]
  );

  /**
   * 노드 데이터 업데이트
   */
  const updateNodeData = useCallback(
    (nodeId: string, data: WorkflowNodeData) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        Object.keys(newAreaNodes).forEach((areaKey) => {
          const area = areaKey as keyof AreaNodes;
          newAreaNodes[area] = newAreaNodes[area].map((node) =>
            node.id === nodeId ? { ...node, data } : node
          );
        });

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
          }))
        );
        scheduleWorkflowChange(blocks);

        return newAreaNodes;
      });
    },
    [scheduleWorkflowChange]
  );

  /**
   * 모든 노드 가져오기
   */
  const getAllNodes = useCallback(() => {
    return [...areaNodes.trigger, ...areaNodes.job, ...areaNodes.step];
  }, [areaNodes.trigger, areaNodes.job, areaNodes.step]);

  /**
   * ServerBlock 배열로 변환
   */
  const getServerBlocks = useCallback(() => {
    const allNodes = getAllNodes();
    return convertNodesToServerBlocks(
      allNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: 0, y: 0 },
        data: n.data as unknown as Record<string, unknown>,
      }))
    );
  }, [getAllNodes]);

  /**
   * 워크스페이스 초기화
   */
  const clearWorkspace = useCallback(() => {
    setAreaNodes({
      trigger: [],
      job: [],
      step: [],
    });
  }, []);

  /**
   * Job의 job-name 변경 시 하위 Step들의 job-name도 업데이트
   */
  const updateStepJobNames = useCallback(
    (jobId: string, newJobName: string) => {
      setAreaNodes((prev) => {
        const newAreaNodes = { ...prev };

        //* 해당 Job의 하위 Step들의 job-name 업데이트
        newAreaNodes.step = newAreaNodes.step.map((step) => {
          if (step.parentId === jobId) {
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
    },
    []
  );

  return {
    areaNodes,
    addNode,
    deleteNode,
    updateNode,
    updateNodeData,
    getAllNodes,
    getServerBlocks,
    clearWorkspace,
    updateStepJobNames,
  };
};
