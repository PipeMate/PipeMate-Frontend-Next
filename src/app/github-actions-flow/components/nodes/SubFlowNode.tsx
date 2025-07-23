import BaseNode from "./BaseNode";
import { Position, NodeProps } from "reactflow";
import { useNodeDelete } from "../ReactFlowWorkspace";
import { NodeContext } from "./BaseNode";
import { Package } from "lucide-react";

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
  // SubFlowNode 전용 색상
  const colors = { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };
  return (
    <NodeContext.Provider
      value={{
        onDelete: (e) => {
          e.stopPropagation();
          deleteNode(id);
        },
      }}
    >
      <BaseNode
        icon={<Package size={18} />}
        title="Steps Container"
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
        style={{ minHeight: data.height || 120 }}
      >
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center gap-2 mb-1.5 w-full">
            <span className="text-base">
              <Package size={16} />
            </span>
            <span className="text-sm font-semibold w-full">서브 플로우</span>
          </div>
          <div className="text-[11px] leading-[1.3] opacity-80 w-full">
            {data.stepCount && data.stepCount > 0 ? (
              <span className="font-bold" style={{ color: colors.text }}>
                {data.stepCount}개의 Step 포함
              </span>
            ) : (
              <span className="italic opacity-60">
                Step 노드들을 여기에 추가하세요
              </span>
            )}
          </div>
          <div
            style={{
              backgroundColor: colors.border,
              color: "#fff",
              marginTop: 6,
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 500,
              display: "inline-block",
              width: "auto",
              alignSelf: "flex-start",
            }}
          >
            SUBFLOW
          </div>
        </div>
      </BaseNode>
    </NodeContext.Provider>
  );
};
