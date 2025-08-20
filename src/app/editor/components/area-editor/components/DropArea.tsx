import React from 'react';
import type { AreaNodeData, AreaNodes } from '../types';
import { getWorkspaceAreaColor } from '../../../constants/nodeConstants';
import { AreaNode } from '../../AreaNode';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
  onNodeEdit?: (node: AreaNodeData) => void;
  onAddBlock?: (areaKey: keyof AreaNodes, jobId?: string) => void;
}

// * 드롭 영역 컴포넌트
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
  onNodeEdit,
  onAddBlock,
}) => {
  const isDragOver = dragOverArea === areaKey;
  const stepsByJob = getStepsByJob();

  // * 버튼 색상 가져오기
  const getButtonStyle = () => {
    switch (areaKey) {
      case 'trigger':
        return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
      case 'job':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      case 'step':
        return 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400';
      default:
        return 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400';
    }
  };

  // * 버튼 텍스트 가져오기
  const getButtonText = () => {
    switch (areaKey) {
      case 'trigger':
        return 'Trigger 추가';
      case 'job':
        return 'Job 추가';
      case 'step':
        return 'Step 추가';
      default:
        return '블록 추가';
    }
  };

  return (
    <div
      className={`w-full min-h-[120px] rounded-lg border-2 border-dashed transition-all duration-300 ${getWorkspaceAreaColor(
        areaKey === 'trigger' ? 'TRIGGER' : areaKey === 'job' ? 'JOB' : 'STEP',
      )} ${getDragOverStyle(areaKey)}`}
      onDragOver={(e) => onDragOver(e, areaKey)}
      onDrop={(e) => onDrop(e, areaKey)}
      onDragLeave={(e) => onDragLeave(e, areaKey)}
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
      <div className="p-3">
        {nodes.length === 0 ? (
          // * 빈 상태 렌더링
          renderEmptyState(areaKey, title, isDragOver)
        ) : (
          // * 노드들 렌더링
          <div
            className={
              areaKey === 'job'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {nodes.map((node, index) => (
              <div key={node.id} className="relative">
                <AreaNode
                  node={node}
                  onSelect={onNodeSelect}
                  onDragStart={onNodeDragStart}
                  onDrag={onNodeDrag}
                  onEdit={onNodeEdit}
                />

                {node.type === 'job' && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Steps</h4>
                      <span className="text-xs text-gray-400">
                        {stepsByJob[node.id]?.length || 0}개
                      </span>
                    </div>
                    <div
                      className={`min-h-[80px] rounded-lg border-2 border-dashed transition-all duration-300 ${
                        dragOverJobId === node.id
                          ? 'border-orange-400 bg-orange-50/50'
                          : 'border-orange-300 bg-orange-50/30'
                      } ${getDragOverStyle(areaKey, true, node.id)}`}
                      onDragOver={(e) => onJobDragOver(e, node.id)}
                      onDrop={(e) => onJobStepDrop(e, node.id)}
                      onDragLeave={(e) => onJobDragLeave(e, node.id)}
                    >
                      {!stepsByJob[node.id] || stepsByJob[node.id].length === 0 ? (
                        // * Step 영역이 비어있을 때
                        renderEmptyState(
                          'step',
                          'Step',
                          dragOverJobId === node.id,
                          true,
                          node.id,
                        )
                      ) : (
                        // * Step들이 있을 때
                        <div className="p-2 space-y-2">
                          {stepsByJob[node.id].map((stepNode, stepIndex) => (
                            <div key={stepNode.id} className="relative">
                              <AreaNode
                                node={stepNode}
                                onSelect={onNodeSelect}
                                onDragStart={onNodeDragStart}
                                onDrag={onNodeDrag}
                                onEdit={onNodeEdit}
                              />
                            </div>
                          ))}
                          {/* Step 추가 버튼 */}
                          {onAddBlock && (
                            <div className="pt-2">
                              <Button
                                onClick={() => onAddBlock('step', node.id)}
                                variant="outline"
                                size="sm"
                                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
                              >
                                <Plus size={16} className="mr-1" />
                                Step 추가
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Job 영역에 Job 추가 버튼 */}
            {areaKey === 'job' && onAddBlock && (
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/30 hover:bg-blue-50/50 transition-all duration-200">
                <Button
                  onClick={() => onAddBlock('job')}
                  variant="default"
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 transition-all duration-200"
                >
                  <Plus size={16} className="mr-1" />
                  Job 추가
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
