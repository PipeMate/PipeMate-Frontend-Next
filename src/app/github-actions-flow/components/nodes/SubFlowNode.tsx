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
      className="subflow-node"
      style={{
        background: "#f8fafc",
        border: "2px solid #f59e0b",
        borderRadius: "8px",
        padding: "12px",
        minHeight: data.height || 100,
        width: "260px",
        position: "relative",
      }}
    >
      {/* 상단 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}
          >
            📦 Steps Container
          </span>
        </div>
        <button
          onClick={handleDelete}
          style={{
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#ef4444";
          }}
        >
          ×
        </button>
      </div>

      {/* Step 노드들이 들어갈 영역 */}
      <div
        style={{
          minHeight: "60px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {data.stepCount && data.stepCount > 0 ? (
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            {data.stepCount} steps included
          </div>
        ) : (
          <div
            style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}
          >
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
