import BaseNode from "./BaseNode";
import { Position, NodeProps } from "reactflow";
import { useNodeDelete } from "../ReactFlowWorkspace";

interface SubFlowNodeData {
  label: string;
  type: string;
  jobId: string;
  stepCount?: number;
  height?: number;
}

export const SubFlowNode: React.FC<NodeProps<SubFlowNodeData>> = ({
  data,
  id,
}) => {
  const deleteNode = useNodeDelete();

  const handles = [
    {
      type: "target" as const,
      position: Position.Top,
      style: { background: "#f59e0b" },
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      style: { background: "#f59e0b" },
    },
  ];

  return (
    <BaseNode
      icon={"📦"}
      title="Steps Container"
      isEditing={false}
      onDelete={(e) => {
        e.stopPropagation();
        deleteNode(id);
      }}
      handles={handles}
      className="subflow-node bg-slate-50 border-2 border-amber-400 rounded-lg p-3 relative w-[260px]"
      style={{ minHeight: data.height || 100 }}
    >
      <div className="min-h-[60px] flex flex-col gap-2">
        {data.stepCount && data.stepCount > 0 ? (
          <div className="text-xs text-gray-500">
            {data.stepCount} steps included
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">
            Step 노드들을 여기에 추가하세요
          </div>
        )}
      </div>
    </BaseNode>
  );
};
