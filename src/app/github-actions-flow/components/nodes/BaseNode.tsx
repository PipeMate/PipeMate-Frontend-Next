//* 기본 노드 컴포넌트 - 모든 노드의 공통 템플릿
//* 모든 노드 타입(Job, Step, Trigger, SubFlow)이 상속받는 기본 구조
import React, { useContext, createContext } from "react";
import { Handle, Position } from "@xyflow/react";

//* 핸들 설정 인터페이스 - 노드 간 연결점 정의
interface HandleConfig {
  type: "source" | "target"; //* source: 나가는 연결, target: 들어오는 연결
  position: Position; //* 핸들의 위치 (Top, Bottom, Left, Right)
  className?: string; //* 커스텀 CSS 클래스
  style?: React.CSSProperties; //* 인라인 스타일
}

//* 노드 컨텍스트 인터페이스 - 편집 모드 상태 공유
interface NodeContextProps {
  isEditing?: boolean; //* 편집 모드 활성화 여부
  onEdit?: (e: React.MouseEvent) => void; //* 편집 시작 핸들러
  onSave?: (e: React.MouseEvent) => void; //* 저장 핸들러
  onDelete?: (e: React.MouseEvent) => void; //* 삭제 핸들러
}

//* 노드 컨텍스트 생성 - 하위 컴포넌트에서 편집 상태 공유
export const NodeContext = createContext<NodeContextProps>({});

//* 기본 노드 Props 인터페이스 - 모든 노드에서 사용하는 공통 속성들
export interface BaseNodeProps {
  icon: React.ReactNode; //* 노드 아이콘 (Lucide 아이콘)
  title: string; //* 노드 제목
  children: React.ReactNode; //* 노드 내용 (설정 UI 또는 정보 표시)
  description?: string; //* 노드 설명
  domain?: string; //* 도메인 정보 (Step 노드에서만 사용)
  task?: string[]; //* 태스크 정보 (Step 노드에서만 사용)
  isEditing?: boolean; //* 편집 모드 상태
  onEdit?: (e: React.MouseEvent) => void; //* 편집 시작 핸들러
  onSave?: (e: React.MouseEvent) => void; //* 저장 핸들러
  onDelete?: (e: React.MouseEvent) => void; //* 삭제 핸들러
  handles?: HandleConfig[]; //* 연결점 설정 배열
  headerButtons?: React.ReactNode; //* 헤더에 추가할 버튼들
  nodeTypeBadge?: React.ReactNode; //* 노드 타입 뱃지
  className?: string; //* 추가 CSS 클래스
  style?: React.CSSProperties; //* 추가 인라인 스타일
  bgColor?: string; //* 배경색
  borderColor?: string; //* 테두리색
  textColor?: string; //* 텍스트색
}

//* 기본 노드 컴포넌트 - 모든 노드의 기본 템플릿
const BaseNode: React.FC<BaseNodeProps> = ({
  icon,
  title,
  children,
  description,
  domain,
  task,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  handles = [],
  headerButtons,
  nodeTypeBadge,
  className = "",
  style = {},
  bgColor,
  borderColor,
  textColor,
}) => {
  //* 컨텍스트에서 편집 상태 가져오기
  const ctx = useContext(NodeContext);
  const _isEditing = isEditing ?? ctx.isEditing ?? false;
  const _onEdit = onEdit ?? ctx.onEdit;
  const _onSave = onSave ?? ctx.onSave;
  const _onDelete = onDelete ?? ctx.onDelete;

  return (
    <div
      className={`
        relative p-4 rounded-xl transition-all duration-200 w-full 
        shadow-sm border-2 flex flex-col gap-3 min-w-0 min-h-0
        hover:shadow-md hover:scale-[1.02] cursor-pointer
        ${className}
      `}
      style={{
        background: bgColor,
        border: borderColor ? `2px solid ${borderColor}` : undefined,
        color: textColor,
        ...style,
      }}
      onClick={_onEdit} //* 노드 클릭 시 편집 모드 활성화
    >
      {/* 핸들 렌더링 - 노드 간 연결점 */}
      {handles.map((h, idx) => (
        <Handle
          key={idx}
          type={h.type}
          position={h.position}
          className={
            h.className ||
            "w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg hover:scale-110 transition-transform"
          }
          style={h.style}
        />
      ))}

      {/* 노드 내부 컨텐츠 - DragDropSidebar 블록과 유사한 레이아웃 */}
      <div className="flex items-center gap-3 mb-3 w-full select-none">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-bold truncate"
              style={{ color: textColor }}
            >
              {title}
            </span>
            {nodeTypeBadge && <div className="flex">{nodeTypeBadge}</div>}
          </div>
          {/* 도메인/태스크 정보 표시 (Step 노드에서만) */}
          {(domain || task) && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/50">
              {domain && <span>{domain}</span>}
              {task && task.length > 0 && (
                <>
                  {domain && <span>•</span>}
                  <span>{task.join(", ")}</span>
                </>
              )}
            </div>
          )}
        </div>
        {headerButtons && (
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            {headerButtons}
          </div>
        )}
      </div>

      {/* 노드 설명 - DragDropSidebar 블록과 유사한 스타일 */}
      {description && (
        <div
          className="text-sm leading-relaxed w-full mb-3"
          style={{ color: textColor, opacity: 0.8 }}
        >
          {description}
        </div>
      )}

      {/* 노드 내용 - 설정 UI 또는 정보 표시 */}
      <div className="text-xs leading-relaxed opacity-90 w-full">
        {children}
      </div>
    </div>
  );
};

export default BaseNode;
