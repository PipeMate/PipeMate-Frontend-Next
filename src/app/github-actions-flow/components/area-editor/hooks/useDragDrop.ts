import { useState, useCallback } from 'react';
import { AreaNodeData, NodeType } from '../types';
import { ServerBlock } from '../../../types';

interface UseDragDropReturn {
  draggedNode: AreaNodeData | null;
  parseDropData: (e: React.DragEvent) => ServerBlock | null;
  convertBlockToNodeData: (block: ServerBlock) => AreaNodeData;
  convertBlockTypeToNodeType: (blockType: string) => NodeType;
}

// * 드래그 앤 드롭 훅
export const useDragDrop = (): UseDragDropReturn => {
  const [draggedNode, setDraggedNode] = useState<AreaNodeData | null>(null);

  // * 드롭 데이터 파싱
  const parseDropData = useCallback((e: React.DragEvent): ServerBlock | null => {
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return null;
      return JSON.parse(data) as ServerBlock;
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
      return null;
    }
  }, []);

  // * 블록을 노드 데이터로 변환
  const convertBlockToNodeData = useCallback((block: ServerBlock): AreaNodeData => {
    return {
      id: block.id || `node-${Date.now()}`,
      type: convertBlockTypeToNodeType(block.type),
      data: {
        label: block.name,
        type: block.type === 'trigger' ? 'workflow_trigger' : block.type,
        description: block.description,
        jobName: block['job-name'] || '',
        domain: block.domain,
        task: block.task,
        config: block.config,
      },
      order: 0,
      isSelected: false,
      isEditing: false,
    };
  }, []);

  // * 블록 타입을 노드 타입으로 변환
  const convertBlockTypeToNodeType = useCallback((blockType: string): NodeType => {
    switch (blockType) {
      case 'trigger':
        return 'workflowTrigger';
      case 'job':
        return 'job';
      case 'step':
        return 'step';
      default:
        return 'step';
    }
  }, []);

  return {
    draggedNode,
    parseDropData,
    convertBlockToNodeData,
    convertBlockTypeToNodeType,
  };
};
