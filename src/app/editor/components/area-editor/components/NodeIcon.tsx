import React from 'react';
import { Code, Layers, Settings, Zap } from 'lucide-react';
import type { NodeType } from '../types';

interface NodeIconProps {
  nodeType: NodeType;
}

export const NodeIcon: React.FC<NodeIconProps> = ({ nodeType }) => {
  const getNodeIcon = (nodeType: NodeType) => {
    switch (nodeType) {
      case 'workflowTrigger':
        return <Zap size={18} className="text-emerald-600" />;
      case 'job':
        return <Settings size={18} className="text-blue-600" />;
      case 'step':
        return <Code size={18} className="text-amber-600" />;
      default:
        return <Layers size={18} className="text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/30">
      {getNodeIcon(nodeType)}
    </div>
  );
};
