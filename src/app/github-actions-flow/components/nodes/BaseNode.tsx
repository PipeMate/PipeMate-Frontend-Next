import React, { useContext, createContext } from "react";
import { Handle, Position } from "reactflow";
import { Check, X } from "lucide-react";

interface HandleConfig {
  type: "source" | "target";
  position: Position;
  className?: string;
  style?: React.CSSProperties;
}

interface NodeContextProps {
  isEditing?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onSave?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const NodeContext = createContext<NodeContextProps>({});

export interface BaseNodeProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isEditing?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onSave?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  handles?: HandleConfig[];
  headerButtons?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

const BaseNode: React.FC<BaseNodeProps> = ({
  icon,
  title,
  children,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  handles = [],
  headerButtons,
  className = "",
  style = {},
  bgColor,
  borderColor,
  textColor,
}) => {
  const ctx = useContext(NodeContext);
  const _isEditing = isEditing ?? ctx.isEditing ?? false;
  const _onEdit = onEdit ?? ctx.onEdit;
  const _onSave = onSave ?? ctx.onSave;
  const _onDelete = onDelete ?? ctx.onDelete;

  return (
    <div
      className={`p-3 rounded-lg transition-all w-full shadow-sm border-2 flex flex-col gap-2 min-w-0 min-h-0 ${className}`}
      style={{
        background: bgColor,
        border: borderColor ? `2px solid ${borderColor}` : undefined,
        color: textColor,
        ...style,
      }}
    >
      {/* 핸들 렌더링 */}
      {handles.map((h, idx) => (
        <Handle
          key={idx}
          type={h.type}
          position={h.position}
          className={
            h.className ||
            "w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
          }
          style={h.style}
        />
      ))}
      {/* 노드 내부 컨텐츠 */}
      <div
        className="flex items-center gap-2 mb-1.5 w-full select-none"
        onClick={(e) => {
          e.stopPropagation();
          _onEdit?.(e);
        }}
      >
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold flex-1 truncate">{title}</span>
        <div className="flex items-center gap-1 ml-auto">
          {_isEditing && _onSave && (
            <button
              onClick={_onSave}
              className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-emerald-600"
              title="저장"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={_onDelete}
            className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
            title="노드 삭제"
          >
            <X size={16} />
          </button>
          {headerButtons}
        </div>
      </div>
      <div className="text-[11px] leading-[1.3] opacity-80 w-full">
        {children}
      </div>
    </div>
  );
};

export default BaseNode;
