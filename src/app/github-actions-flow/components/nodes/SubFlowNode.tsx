import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  return (
    <div
      className="subflow-node bg-slate-50 border-2 border-amber-400 rounded-lg p-3 relative w-[260px]"
      style={{ minHeight: data.height || 100 }}
    >
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            📦 Steps Container
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors hover:bg-red-600"
        >
          ×
        </button>
      </div>

      {/* Step 노드들이 들어갈 영역 */}
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

      {/* React Flow 핸들들 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#f59e0b" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#f59e0b" }}
      />
    </div>
  );
};
