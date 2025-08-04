import React from "react";
import { Save, X, Eye, Edit, Trash2 } from "lucide-react";
import { AreaNodeData } from "../types";

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: AreaNodeData | null;
  onSaveWorkflow: () => void;
  onClearWorkspace: () => void;
  onNodeSelect: (node: AreaNodeData) => void;
  onNodeEdit: (node: AreaNodeData) => void;
  onNodeDelete: (nodeId: string) => void;
  hasNodes: boolean;
}

/**
 * 워크플로우 컨트롤 패널 컴포넌트
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  isOpen,
  onClose,
  selectedNode,
  onSaveWorkflow,
  onClearWorkspace,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  hasNodes,
}) => {
  if (!hasNodes || !isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 z-30"
        onClick={onClose}
      />

      {/* 바텀 시트 */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out">
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 패널 내용 */}
        <div className="px-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              워크플로우 컨트롤
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 워크플로우 전체 액션 */}
          <div className="space-y-4 mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">
              워크플로우 액션
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onSaveWorkflow}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium transition-colors hover:bg-emerald-600"
              >
                <Save size={18} />
                저장
              </button>
              <button
                onClick={onClearWorkspace}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium transition-colors hover:bg-red-600"
              >
                <Trash2 size={18} />
                초기화
              </button>
            </div>
          </div>

          {/* 선택된 노드 액션들 */}
          {selectedNode && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700 mb-3">
                선택된 노드: {selectedNode.data.label}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onNodeSelect(selectedNode)}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 bg-blue-500 text-white rounded-xl font-medium transition-colors hover:bg-blue-600"
                  title="YAML 미리보기"
                >
                  <Eye size={18} />
                  <span className="text-xs">미리보기</span>
                </button>
                <button
                  onClick={() => onNodeEdit(selectedNode)}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 bg-yellow-500 text-white rounded-xl font-medium transition-colors hover:bg-yellow-600"
                  title="노드 편집"
                >
                  <Edit size={18} />
                  <span className="text-xs">편집</span>
                </button>
                <button
                  onClick={() => onNodeDelete(selectedNode.id)}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 bg-red-500 text-white rounded-xl font-medium transition-colors hover:bg-red-600"
                  title="노드 삭제"
                >
                  <Trash2 size={18} />
                  <span className="text-xs">삭제</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
