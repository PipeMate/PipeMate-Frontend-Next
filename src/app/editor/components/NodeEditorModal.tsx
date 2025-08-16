'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeEditor } from './NodeEditor';
import { WorkflowNodeData } from '../types';
import { NodeType } from './area-editor/types';

interface NodeEditorModalProps {
  isOpen: boolean;
  nodeData: WorkflowNodeData | null;
  nodeType: NodeType | null;
  onClose: () => void;
  onSave: (updatedData: WorkflowNodeData) => void;
}

export const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  isOpen,
  nodeData,
  nodeType,
  onClose,
  onSave,
}) => {
  if (!nodeData || !nodeType) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>노드 편집</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <NodeEditor
            nodeData={nodeData}
            nodeType={nodeType}
            onSave={(updatedData) => {
              onSave(updatedData);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
