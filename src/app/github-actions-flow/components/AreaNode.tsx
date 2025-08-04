import React, { useCallback } from "react";
import { AreaNodeProps, AreaNodeData } from "./area-editor/types/areaNode";
import { getNodeStyle } from "./area-editor/utils/nodeStyles";
import { NodeIcon } from "./area-editor/components/NodeIcon";
import { BlockSummary } from "./area-editor/components/BlockSummary";

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

  const isChild = node.parentId !== undefined;
  const style = getNodeStyle(node.type, isChild, node.data.domain);
  const isSelected = node.isSelected;
  const isEditing = node.isEditing;

  return (
    <div
      className={`area-node ${isSelected ? "ring-2 ring-blue-500" : ""} ${
        isEditing ? "ring-2 ring-yellow-500" : ""
      } hover:scale-[1.02] transition-all duration-200`}
      style={{
        ...style,
        boxShadow:
          isSelected || isEditing
            ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
            : "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onClick={handleClick}
    >
      {/* 블록 헤더 - 아이콘과 제목 */}
      <div className="flex items-center gap-2 mb-2">
        <NodeIcon nodeType={node.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold truncate"
              style={{ color: style.color }}
            >
              {node.data.label}
            </span>
          </div>
        </div>

        {/* Job 이름 표시 (Job과 Step 노드에서) */}
        {node.data.jobName && (node.type === "job" || node.type === "step") && (
          <span className="text-xs bg-white/60 px-2 py-1 rounded-full font-medium">
            {node.data.jobName}
          </span>
        )}
      </div>

      {/* 블록 내용 - 요약 정보 표시 */}
      <div className="space-y-1">
        <BlockSummary node={node} />
      </div>

      {/* 드래그 핸들 */}
      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-3 h-3 bg-white/60 rounded-full cursor-grab border border-gray-300" />
      </div>
    </div>
  );
};
