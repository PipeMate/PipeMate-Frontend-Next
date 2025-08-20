'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import type { AreaNodeData } from '../../area-editor/types';
import type { WorkflowNodeData } from '../../../types';
import NodeEditor from '../NodeEditor';

interface EditorTabProps {
  selectedNode: AreaNodeData | null;
  onSave: (updatedData: WorkflowNodeData) => void;
  onCancel: () => void;
  onDelete?: (nodeId: string) => void;
  onMissingSecrets: (missing: string[]) => void;
}

const EditorTab: React.FC<EditorTabProps> = ({
  selectedNode,
  onSave,
  onCancel,
  onDelete,
  onMissingSecrets,
}) => {
  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {selectedNode ? (
        <NodeEditor
          nodeData={selectedNode.data}
          nodeType={selectedNode.type}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={onDelete ? () => onDelete(selectedNode.id) : undefined}
          onMissingSecrets={onMissingSecrets}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <div className="p-4 text-center">
            <Edit className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              편집할 노드를 선택하세요
            </h3>
            <p className="text-sm text-gray-500">
              워크플로우에서 편집할 블록을 클릭하면 여기서 편집할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorTab;
