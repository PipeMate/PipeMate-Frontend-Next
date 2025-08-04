import { useCallback } from "react";
import { ServerBlock, WorkflowNodeData } from "../../../types";
import { AreaNodes, NodeType } from "../types";
import { toast } from "react-toastify";

/**
 * 드롭 핸들러 관리 훅
 */
export const useDropHandlers = (
  areaNodes: AreaNodes,
  addNode: (
    nodeType: NodeType,
    nodeData: WorkflowNodeData,
    parentId?: string
  ) => void,
  clearDragState?: () => void
) => {
  /**
   * 드롭 이벤트 핸들러
   * 블록을 특정 영역에 드롭했을 때 호출됩니다.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent, targetArea: keyof AreaNodes) => {
      e.preventDefault();
      e.stopPropagation(); //* 이벤트 버블링 방지

      //* 드래그 상태 초기화
      clearDragState?.();

      try {
        const data = e.dataTransfer.getData("application/reactflow");
        if (data) {
          const parsedData = JSON.parse(data);

          //* 파이프라인 드롭 처리
          if (parsedData.type === "pipeline") {
            const blocks = parsedData.blocks;

            //* 파이프라인의 job과 step들을 분리하여 처리
            const jobBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "job"
            );
            const stepBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "step"
            );
            const triggerBlocks = blocks.filter(
              (block: ServerBlock) => block.type === "trigger"
            );

            //* 1. 먼저 trigger 블록들 생성 (토스트 없이)
            triggerBlocks.forEach((block: ServerBlock) => {
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "workflow_trigger",
                description: block.description,
                jobName: block["job-name"] || "",
                domain: block.domain,
                task: block.task,
                config: block.config,
              };
              addNode("workflowTrigger", nodeData, undefined);
            });

            //* 2. job 블록들 생성 (토스트 없이)
            jobBlocks.forEach((block: ServerBlock) => {
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "job",
                description: block.description,
                jobName: block["job-name"] || "",
                domain: block.domain,
                task: block.task,
                config: block.config,
              };
              addNode("job", nodeData, undefined);
            });

            //* 3. step 블록들을 해당 job에 연결하여 생성 (토스트 없이)
            stepBlocks.forEach((block: ServerBlock) => {
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "step",
                description: block.description,
                jobName: block["job-name"] || "",
                domain: block.domain,
                task: block.task,
                config: block.config,
              };

              //* step의 job-name에 해당하는 job을 찾아서 parentId 설정
              let parentId: string | undefined;
              if (block["job-name"]) {
                const targetJob = areaNodes.job.find(
                  (job) => job.data.jobName === block["job-name"]
                );
                if (targetJob) {
                  parentId = targetJob.id;
                  nodeData.jobName = targetJob.data.jobName; // 해당 Job의 이름 사용
                }
              } else {
                //* job-name이 없는 경우, 가장 최근에 생성된 job을 부모로 설정
                const latestJob = areaNodes.job[areaNodes.job.length - 1];
                if (latestJob) {
                  parentId = latestJob.id;
                  nodeData.jobName = latestJob.data.jobName || "";
                }
              }

              addNode("step", nodeData, parentId);
            });

            //* 파이프라인 드롭 완료 토스트 (한 번만 표시)
            toast.success(
              `파이프라인 "${parsedData.pipeline?.name || "Unknown"}" 추가됨`
            );

            return;
          }

          //* 개별 블록 드롭 처리
          const block: ServerBlock = parsedData;
          const nodeType =
            block.type === "trigger"
              ? "workflowTrigger"
              : block.type === "job"
              ? "job"
              : "step";

          const nodeData: WorkflowNodeData = {
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

          //* Step을 Job 영역에 드롭한 경우, 가장 가까운 Job을 부모로 설정
          let parentId: string | undefined;
          if (nodeType === "step" && targetArea === "job") {
            const jobNodes = areaNodes.job;
            if (jobNodes.length > 0) {
              const parentJob = jobNodes[jobNodes.length - 1];
              parentId = parentJob.id;
              nodeData.jobName = parentJob.data.jobName || "";
            }
          }

          addNode(nodeType as NodeType, nodeData, parentId);
        }
      } catch (error) {
        console.error("드롭 처리 오류:", error);
      }
    },
    [addNode, areaNodes.job]
  );

  /**
   * 드롭 핸들러 - 영역별
   */
  const handleAreaDrop = useCallback(
    (e: React.DragEvent, areaKey: keyof AreaNodes) => {
      e.preventDefault();
      e.stopPropagation(); //* 이벤트 버블링 방지

      //* 드래그 상태 초기화
      clearDragState?.();

      //* 블록 라이브러리에서 드롭된 경우
      if (e.dataTransfer.types.includes("application/reactflow")) {
        const blockData = JSON.parse(
          e.dataTransfer.getData("application/reactflow")
        );

        //* 파이프라인 드롭인 경우 handleDrop으로 위임
        if (blockData.type === "pipeline") {
          handleDrop(e, areaKey);
          return;
        }

        //* 개별 블록인 경우
        const block: ServerBlock = blockData;

        //* 드롭 유효성 검사
        if (areaKey === "trigger" && block.type !== "trigger") {
          toast.error("Trigger 블록만 드롭 가능합니다");
          return;
        }

        if (areaKey === "job" && block.type !== "job") {
          //* Step 블록을 Job 영역에 드롭한 경우, 가장 최근 Job의 내부로 리다이렉트
          if (block.type === "step") {
            const jobNodes = areaNodes.job;
            if (jobNodes.length > 0) {
              const parentJob = jobNodes[jobNodes.length - 1];
              const nodeData: WorkflowNodeData = {
                label: block.name,
                type: "step",
                description: block.description,
                jobName: parentJob.data.jobName || "", // 해당 Job의 이름 사용
                domain: block.domain,
                task: block.task,
                config: block.config,
              };
              addNode("step", nodeData, parentJob.id);
              return;
            }
          }
          toast.error("Job 블록만 드롭 가능합니다");
          return;
        }

        const nodeType =
          block.type === "trigger"
            ? "workflowTrigger"
            : block.type === "job"
            ? "job"
            : "step";

        const nodeData: WorkflowNodeData = {
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

        addNode(nodeType as NodeType, nodeData);
      }
    },
    [addNode, areaNodes.job, handleDrop]
  );

  /**
   * 드롭 핸들러 - Job 내부 Step 영역
   */
  const handleJobStepDrop = useCallback(
    (e: React.DragEvent, jobId: string) => {
      e.preventDefault();
      e.stopPropagation();

      //* 드래그 상태 초기화
      clearDragState?.();

      //* 블록 라이브러리에서 드롭된 경우
      if (e.dataTransfer.types.includes("application/reactflow")) {
        const blockData = JSON.parse(
          e.dataTransfer.getData("application/reactflow")
        );

        //* 파이프라인 드롭인 경우 handleDrop으로 위임
        if (blockData.type === "pipeline") {
          handleDrop(e, "job");
          return;
        }

        //* Step 블록만 Job 내부에 드롭 가능
        if (blockData.type === "step") {
          const block: ServerBlock = blockData;

          //* 해당 Job의 이름을 찾아서 Step의 jobName으로 설정
          const parentJob = areaNodes.job.find((job) => job.id === jobId);
          const jobName = parentJob?.data.jobName || block["job-name"] || "";

          const nodeData: WorkflowNodeData = {
            label: block.name,
            type: "step",
            description: block.description,
            jobName: jobName,
            domain: block.domain,
            task: block.task,
            config: block.config,
          };

          addNode("step", nodeData, jobId);
        } else {
          toast.error("Step 블록만 드롭 가능합니다");
        }
      }
    },
    [addNode, handleDrop]
  );

  return {
    handleDrop,
    handleAreaDrop,
    handleJobStepDrop,
  };
};
