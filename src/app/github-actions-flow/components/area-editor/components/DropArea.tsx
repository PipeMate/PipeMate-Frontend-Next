import React from 'react';
import { AreaNodeData, AreaNodes } from '../types';
import { getWorkspaceAreaColor } from '../../../constants/nodeConstants';
import { AreaNode } from '../../AreaNode';

interface DropAreaProps {
  areaKey: keyof AreaNodes;
  title: string;
  nodes: AreaNodeData[];
  maxItems?: number;
  onNodeSelect: (node: AreaNodeData) => void;
  onNodeDragStart: (node: AreaNodeData) => void;
  onNodeDrag: (e: React.DragEvent, node: AreaNodeData) => void;
  onDragOver: (e: React.DragEvent, areaKey: string) => void;
  onDrop: (e: React.DragEvent, areaKey: keyof AreaNodes) => void;
  onDragLeave: (e: React.DragEvent, areaKey: string) => void;
  onJobDragOver: (e: React.DragEvent, jobId: string) => void;
  onJobStepDrop: (e: React.DragEvent, jobId: string) => void;
  onJobDragLeave: (e: React.DragEvent, jobId: string) => void;
  getDragOverStyle: (areaKey: string, isJobStep?: boolean, jobId?: string) => string;
  getStepsByJob: () => Record<string, AreaNodeData[]>;
  renderEmptyState: (
    areaKey: keyof AreaNodes,
    title: string,
    isDragOver: boolean,
    isJobStep?: boolean,
    jobId?: string,
  ) => React.ReactNode;
  dragOverArea: string | null;
  dragOverJobId: string | null;
  //* 새로운 접근성 및 터치 지원 props
  onTouchStart?: (e: React.TouchEvent, node: AreaNodeData) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
  onKeyNavigation?: (e: React.KeyboardEvent, nodeId: string) => void;
  focusedNodeId?: string | null;
  focusedArea?: string | null;
  getFocusStyle?: (nodeId: string, areaKey?: string) => string;
}

/**
 * 드롭 영역 컴포넌트
 * 키보드 접근성 및 터치 DnD 지원 포함
 */
export const DropArea: React.FC<DropAreaProps> = ({
  areaKey,
  title,
  nodes,
  maxItems,
  onNodeSelect,
  onNodeDragStart,
  onNodeDrag,
  onDragOver,
  onDrop,
  onDragLeave,
  onJobDragOver,
  onJobStepDrop,
  onJobDragLeave,
  getDragOverStyle,
  getStepsByJob,
  renderEmptyState,
  dragOverArea,
  dragOverJobId,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onKeyNavigation,
  focusedNodeId,
  focusedArea,
  getFocusStyle,
}) => {
  const isDragOver = dragOverArea === areaKey;
  const stepsByJob = getStepsByJob();

  return (
    <div
      className={`w-full min-h-[120px] rounded-lg border-2 border-dashed transition-all duration-300 ${getWorkspaceAreaColor(
        areaKey === 'trigger' ? 'TRIGGER' : areaKey === 'job' ? 'JOB' : 'STEP'
      )} ${getDragOverStyle(areaKey)}`}
      onDragOver={(e) => onDragOver(e, areaKey)}
      onDrop={(e) => onDrop(e, areaKey)}
      onDragLeave={(e) => onDragLeave(e, areaKey)}
      role="region"
      aria-label={`${title} 영역`}
      tabIndex={-1}
    >
      {/* 영역 헤더 */}
      <div className="p-3 border-b border-gray-200 bg-white/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className="text-xs text-gray-500">
            {nodes.length}개 {maxItems ? `/ ${maxItems}` : ''}
          </span>
        </div>
      </div>

      {/* 노드 컨테이너 */}
      <div className="p-3 space-y-3">
        {nodes.length === 0 ? (
          //* 빈 상태 렌더링
          renderEmptyState(areaKey, title, isDragOver)
        ) : (
          //* 노드들 렌더링
          nodes.map((node, index) => {
            const isFocused = focusedNodeId === node.id || focusedArea === areaKey;
            const focusStyle = getFocusStyle ? getFocusStyle(node.id, areaKey) : '';
            
            return (
              <div key={node.id} className="relative">
                <AreaNode
                  node={node}
                  onSelect={onNodeSelect}
                  onDragStart={onNodeDragStart}
                  onDrag={onNodeDrag}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onKeyNavigation={onKeyNavigation}
                  isFocused={isFocused}
                  tabIndex={index}
                />
                
                {/* 포커스 스타일 적용 */}
                {focusStyle && (
                  <div className={`absolute inset-0 rounded-lg pointer-events-none ${focusStyle}`} />
                )}

                {/* Job 내부의 Step들 렌더링 */}
                {node.type === 'job' && stepsByJob[node.id] && stepsByJob[node.id].length > 0 && (
                  <div className="mt-3 ml-6 pl-4 border-l-2 border-gray-200">
                    <div className="space-y-2">
                      {stepsByJob[node.id].map((stepNode, stepIndex) => {
                        const isStepFocused = focusedNodeId === stepNode.id;
                        const stepFocusStyle = getFocusStyle ? getFocusStyle(stepNode.id) : '';
                        
                        return (
                          <div key={stepNode.id} className="relative">
                            <AreaNode
                              node={stepNode}
                              onSelect={onNodeSelect}
                              onDragStart={onNodeDragStart}
                              onDrag={onNodeDrag}
                              onTouchStart={onTouchStart}
                              onTouchMove={onTouchMove}
                              onTouchEnd={onTouchEnd}
                              onKeyNavigation={onKeyNavigation}
                              isFocused={isStepFocused}
                              tabIndex={nodes.length + stepIndex}
                            />
                            
                            {/* Step 포커스 스타일 적용 */}
                            {stepFocusStyle && (
                              <div className={`absolute inset-0 rounded-lg pointer-events-none ${stepFocusStyle}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 접근성 안내 (스크린 리더용) */}
      <div className="sr-only">
        <span>
          {nodes.length === 0 
            ? `${title} 영역이 비어있습니다. 사이드바에서 블록을 드래그하여 추가하세요.`
            : `${title} 영역에 ${nodes.length}개의 블록이 있습니다. Tab 키로 탐색할 수 있습니다.`
          }
        </span>
      </div>
    </div>
  );
};
