import React, { useCallback } from 'react';
import { AreaNodeData } from './area-editor/types';
import { getNodeStyle } from './area-editor/utils/nodeStyles';
import { NodeIcon } from './area-editor/components/NodeIcon';
import { BlockSummary } from './area-editor/components/BlockSummary';
import { Info, GripVertical } from 'lucide-react';

interface AreaNodeProps {
  node: AreaNodeData;
  onSelect: (node: AreaNodeData) => void;
  onDragStart: (node: AreaNodeData) => void;
  onDrag: (e: React.DragEvent, node: AreaNodeData) => void;
}

/**
 * 영역 기반 노드 컴포넌트
 */
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
    [node, onSelect],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      onDragStart(node);
    },
    [node, onDragStart],
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      onDrag(e, node);
    },
    [node, onDrag],
  );

  const nodeStyle = getNodeStyle(node.type, node.parentId !== undefined, node.data.domain);
  const isSelected = node.isSelected;
  const isEditing = node.isEditing;

  return (
    <div
      className={`area-node relative p-4 rounded-lg border-2 cursor-pointer select-none ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${
        isEditing ? 'ring-2 ring-yellow-500' : ''
      } hover:scale-[1.02] transition-all duration-200`}
      style={nodeStyle}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onClick={handleClick}
    >
      {/* 드래그 핸들 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={16} className="text-gray-400" />
      </div>

      {/* 노드 헤더 */}
      <div className="flex items-center gap-3 mb-3">
        <NodeIcon nodeType={node.type} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {node.data.label}
          </h4>
          {node.data.description && (
            <p className="text-xs text-gray-500 truncate">
              {node.data.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Info size={14} className="text-gray-400" />
        </div>
      </div>

      {/* 노드 내용 */}
      <BlockSummary node={node} />
    </div>
  );
};
