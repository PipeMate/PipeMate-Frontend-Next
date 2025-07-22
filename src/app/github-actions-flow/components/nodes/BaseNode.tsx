import React from "react";
import { Handle, Position } from "reactflow";

interface HandleConfig {
  type: "source" | "target";
  position: Position;
  className?: string;
  style?: React.CSSProperties;
}

interface BaseNodeProps {
  icon: React.ReactNode;
  title: string;
  isEditing: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onSave?: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  handles?: HandleConfig[];
  headerButtons?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = ({
  icon,
  title,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  handles = [],
  headerButtons,
  className = "",
  style = {},
  children,
}) => {
  return (
    <div className={`reactflow-node ${className}`} style={style}>
      {/* 핸들 렌더링 */}
      {handles.map((h, idx) => (
        <Handle
          key={idx}
          type={h.type}
          position={h.position}
          className={h.className}
          style={h.style}
        />
      ))}

      {/* 노드 내부 컨텐츠 */}
      <div className="node-content" onClick={onEdit}>
        <div className="node-header">
          <span className="node-icon">{icon}</span>
          <span className="node-title">{title}</span>
          <div className="header-buttons">
            {isEditing && onSave && (
              <button onClick={onSave} className="save-btn" title="저장">
                ✓
              </button>
            )}
            <button
              onClick={onDelete}
              className="delete-node-btn"
              title="노드 삭제"
            >
              ×
            </button>
            {headerButtons}
          </div>
        </div>
        <div className="node-body">{children}</div>
      </div>
    </div>
  );
};

export default BaseNode;
