import React, { useCallback, useRef, useEffect } from 'react';
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
  onTouchStart?: (e: React.TouchEvent, node: AreaNodeData) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
  onKeyNavigation?: (e: React.KeyboardEvent, nodeId: string) => void;
  isFocused?: boolean;
  tabIndex?: number;
}

/**
 * 영역 기반 노드 컴포넌트
 * 키보드 접근성 및 터치 DnD 지원 포함
 */
export const AreaNode: React.FC<AreaNodeProps> = ({
  node,
  onSelect,
  onDragStart,
  onDrag,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onKeyNavigation,
  isFocused = false,
  tabIndex = 0,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  //* 포커스 상태에 따른 스크롤 처리
  useEffect(() => {
    if (isFocused && nodeRef.current) {
      nodeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isFocused]);

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

  //* ========================================
  //* 터치 이벤트 핸들러
  //* ========================================

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (onTouchStart) {
        onTouchStart(e, node);
      }
    },
    [node, onTouchStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (onTouchMove) {
        onTouchMove(e);
      }
    },
    [onTouchMove],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (onTouchEnd) {
        onTouchEnd();
      }
    },
    [onTouchEnd],
  );

  //* ========================================
  //* 키보드 이벤트 핸들러
  //* ========================================

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(node);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          //* 노드 삭제 이벤트 발생
          const deleteEvent = new CustomEvent('nodeDelete', { detail: node });
          window.dispatchEvent(deleteEvent);
          break;
        default:
          //* 네비게이션 이벤트는 상위 컴포넌트에서 처리
          if (onKeyNavigation) {
            onKeyNavigation(e, node.id);
          }
          break;
      }
    },
    [node, onSelect, onKeyNavigation],
  );

  const handleFocus = useCallback(() => {
    //* 포커스 시 시각적 피드백
    if (nodeRef.current) {
      nodeRef.current.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
    }
  }, []);

  const handleBlur = useCallback(() => {
    //* 포커스 해제 시 시각적 피드백 제거
    if (nodeRef.current) {
      nodeRef.current.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
    }
  }, []);

  const isChild = node.parentId !== undefined;
  const style = getNodeStyle(node.type, isChild, node.data.domain);
  const isSelected = node.isSelected;
  const isEditing = node.isEditing;

  return (
    <div
      ref={nodeRef}
      className={`area-node relative p-4 rounded-lg border-2 cursor-pointer select-none ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${
        isEditing ? 'ring-2 ring-yellow-500' : ''
      } ${
        isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      style={{
        ...style,
        boxShadow:
          isSelected || isEditing || isFocused
            ? '0 0 0 2px rgba(59, 130, 246, 0.5)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
      draggable
      tabIndex={tabIndex}
      role="button"
      aria-label={`${node.data.label} 블록${node.data.description ? ` - ${node.data.description}` : ''}`}
      aria-pressed={isSelected}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* 블록 헤더 - 아이콘과 제목 */}
      <div className="flex items-center gap-2 mb-3">
        <NodeIcon nodeType={node.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold truncate" style={{ color: style.color }}>
              {node.data.label}
            </span>
          </div>
        </div>

        {/* Job 이름 또는 도메인/태스크 배지 - 우측 상단 */}
        {node.data.jobName && (node.type === 'job' || node.type === 'step') && (
          <span className="text-xs bg-white/80 px-2 py-1 rounded-full font-medium shadow-sm border border-gray-200">
            {node.data.jobName}
          </span>
        )}
        {node.type === 'step' &&
          (node.data.domain || node.data.task) &&
          !node.data.jobName && (
            <span className="text-xs bg-white/80 px-2 py-1 rounded-full font-medium shadow-sm border border-gray-200">
              {node.data.domain && node.data.task && node.data.task.length > 0
                ? `${node.data.domain} • ${node.data.task.join(', ')}`
                : node.data.domain || node.data.task?.join(', ')}
            </span>
          )}
      </div>

      {/* 기본 정보 표시 */}
      <div className="space-y-2 mb-3">
        {/* Description 정보 - 말줄임으로 */}
        {node.data.description && (
          <div className="flex items-start gap-1 text-xs opacity-90">
            <Info size={10} className="mt-0.5 flex-shrink-0" />
            <span className="truncate max-w-[280px] leading-relaxed">
              {node.data.description}
            </span>
          </div>
        )}
      </div>

      {/* 블록 내용 - 요약 정보 표시 */}
      <div className="space-y-2">
        <BlockSummary node={node} />
      </div>

      {/* 드래그 핸들 - 접근성 개선 */}
      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
        <div 
          className="w-6 h-6 bg-white/80 rounded-full cursor-grab border border-gray-300 flex items-center justify-center"
          role="button"
          tabIndex={-1}
          aria-label="드래그 핸들"
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = 'grabbing';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.cursor = 'grab';
          }}
        >
          <GripVertical size={12} className="text-gray-500" />
        </div>
      </div>

      {/* 키보드 접근성 안내 (스크린 리더용) */}
      <div className="sr-only">
        <span>Enter 또는 Space 키로 선택, Delete 키로 삭제, 화살표 키로 이동</span>
      </div>
    </div>
  );
};
