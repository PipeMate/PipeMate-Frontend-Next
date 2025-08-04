import React, { useCallback } from "react";
import { AreaNodeData, NodeType } from "./AreaBasedWorkflowEditor";
import { WorkflowNodeData } from "../types";

interface AreaNodeProps {
  node: AreaNodeData;
  onSelect: (node: AreaNodeData) => void;
  onDragStart: (node: AreaNodeData) => void;
  onDrag: (e: React.DragEvent, node: AreaNodeData) => void;
}

export const AreaNode: React.FC<AreaNodeProps> = ({
  node,
  onSelect,
  onDragStart,
  onDrag,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node);
    },
    [node, onSelect]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      onDragStart(node);
    },
    [node, onDragStart]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      onDrag(e, node);
    },
    [node, onDrag]
  );

  const getNodeStyle = (nodeType: NodeType, isChild?: boolean) => {
    const baseStyle = {
      width: isChild ? "90%" : "100%",
      minHeight: isChild ? "40px" : "60px",
      padding: isChild ? "8px" : "12px",
      borderRadius: "8px",
      border: "2px solid",
      cursor: "grab",
      userSelect: "none" as const,
      transition: "all 0.2s ease",
      position: "relative" as const,
    };

    switch (nodeType) {
      case "workflowTrigger":
        return {
          ...baseStyle,
          backgroundColor: "#dbeafe",
          borderColor: "#3b82f6",
          color: "#1e40af",
        };
      case "job":
        return {
          ...baseStyle,
          backgroundColor: "#dcfce7",
          borderColor: "#22c55e",
          color: "#166534",
        };
      case "step":
        return {
          ...baseStyle,
          backgroundColor: "#fed7aa",
          borderColor: "#f97316",
          color: "#9a3412",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: "#f3f4f6",
          borderColor: "#6b7280",
          color: "#374151",
        };
    }
  };

  const getNodeIcon = (nodeType: NodeType) => {
    switch (nodeType) {
      case "workflowTrigger":
        return "⚡";
      case "job":
        return "🔧";
      case "step":
        return "📋";
      default:
        return "📄";
    }
  };

  const getNodeTitle = (nodeType: NodeType) => {
    switch (nodeType) {
      case "workflowTrigger":
        return "워크플로우 트리거";
      case "job":
        return "Job";
      case "step":
        return "Step";
      default:
        return "노드";
    }
  };

  const isChild = node.parentId !== undefined;
  const style = getNodeStyle(node.type, isChild);
  const isSelected = node.isSelected;
  const isEditing = node.isEditing;

  return (
    <div
      className={`area-node ${isSelected ? "ring-2 ring-blue-500" : ""} ${
        isEditing ? "ring-2 ring-yellow-500" : ""
      }`}
      style={{
        ...style,
        boxShadow:
          isSelected || isEditing
            ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
            : "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onClick={handleClick}
    >
      {/* 노드 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={isChild ? "text-sm" : "text-lg"}>
            {getNodeIcon(node.type)}
          </span>
          <span className={`${isChild ? "text-xs" : "text-xs"} font-semibold`}>
            {getNodeTitle(node.type)}
          </span>
          <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
            #{node.order + 1}
          </span>
        </div>
        {node.data.jobName && (
          <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
            {node.data.jobName}
          </span>
        )}
      </div>

      {/* 노드 내용 */}
      <div className={`${isChild ? "text-xs" : "text-sm"} font-medium mb-1`}>
        {node.data.label}
      </div>

      {node.data.description && !isChild && (
        <div className="text-xs opacity-75 mb-2 line-clamp-2">
          {node.data.description}
        </div>
      )}

      {/* 드래그 핸들 */}
      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-2 h-2 bg-gray-400 rounded-full cursor-grab" />
      </div>
    </div>
  );
};
