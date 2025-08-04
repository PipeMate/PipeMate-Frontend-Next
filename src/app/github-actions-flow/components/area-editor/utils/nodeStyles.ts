import { NodeType } from "../types";
import { NODE_COLORS, getDomainColor } from "../../../constants/nodeConstants";

export interface NodeStyle {
  width: string;
  minHeight: string;
  padding: string;
  borderRadius: string;
  border: string;
  cursor: string;
  userSelect: "none";
  transition: string;
  position: "relative";
  boxShadow: string;
  overflow: string;
  backgroundColor: string;
  borderColor: string;
  color: string;
}

/**
 * 노드 스타일 생성 함수
 */
export const getNodeStyle = (
  nodeType: NodeType,
  isChild?: boolean,
  domain?: string
): NodeStyle => {
  const baseStyle = {
    width: "100%", //* 부모 컨테이너의 너비에 맞춤
    minHeight: isChild ? "60px" : "80px", //* 최소 높이만 설정
    padding: isChild ? "10px" : "14px",
    borderRadius: "10px",
    border: "2px solid",
    cursor: "grab",
    userSelect: "none" as const,
    transition: "all 0.2s ease",
    position: "relative" as const,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    overflow: "visible", //* 내용이 넘쳐도 보이도록 변경
  };

  //* 트리거 노드
  if (nodeType === "workflowTrigger") {
    const nodeColors = NODE_COLORS.TRIGGER;
    return {
      ...baseStyle,
      padding: "12px",
      backgroundColor: nodeColors.bg,
      borderColor: nodeColors.border,
      color: nodeColors.text,
    };
  }

  //* Job 노드
  if (nodeType === "job") {
    const nodeColors = NODE_COLORS.JOB;
    return {
      ...baseStyle,
      padding: "14px",
      backgroundColor: nodeColors.bg,
      borderColor: nodeColors.border,
      color: nodeColors.text,
    };
  }

  //* Step 노드의 경우 도메인별 색상 적용
  if (nodeType === "step" && domain) {
    const domainColors = getDomainColor(domain);
    return {
      ...baseStyle,
      padding: "12px", //* Step은 좀 더 컴팩트하게
      backgroundColor: domainColors.bg,
      borderColor: domainColors.border,
      color: domainColors.text,
    };
  }

  //* 기본 Step 노드
  const nodeColors = NODE_COLORS.STEP;
  return {
    ...baseStyle,
    padding: "12px",
    backgroundColor: nodeColors.bg,
    borderColor: nodeColors.border,
    color: nodeColors.text,
  };
};
