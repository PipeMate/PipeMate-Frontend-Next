import { NodeType } from "../types";
import { NODE_COLORS, getDomainColor } from "../../../constants/nodeConstants";

export interface NodeStyle {
  width: string;
  minHeight: string;
  maxHeight: string;
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
    width: isChild ? "280px" : "320px", //* 최대 크기 제한
    minHeight: isChild ? "60px" : "80px",
    maxHeight: isChild ? "100px" : "120px", //* 최대 높이 제한
    padding: isChild ? "10px" : "14px",
    borderRadius: "10px",
    border: "2px solid",
    cursor: "grab",
    userSelect: "none" as const,
    transition: "all 0.2s ease",
    position: "relative" as const,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    overflow: "hidden", //* 내용이 넘칠 경우 숨김
  };

  //* 트리거 노드는 더 컴팩트하게
  if (nodeType === "workflowTrigger") {
    const nodeColors = NODE_COLORS.TRIGGER;
    return {
      ...baseStyle,
      width: "280px",
      minHeight: "60px",
      maxHeight: "90px",
      padding: "10px",
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
      backgroundColor: domainColors.bg,
      borderColor: domainColors.border,
      color: domainColors.text,
    };
  }

  //* 노드 타입별 색상 적용
  const getNodeTypeKey = (nodeType: NodeType): keyof typeof NODE_COLORS => {
    switch (nodeType) {
      case "workflowTrigger":
        return "TRIGGER";
      case "job":
        return "JOB";
      case "step":
        return "STEP";
      default:
        return "STEP";
    }
  };

  const nodeColors = NODE_COLORS[getNodeTypeKey(nodeType)];

  return {
    ...baseStyle,
    backgroundColor: nodeColors.bg,
    borderColor: nodeColors.border,
    color: nodeColors.text,
  };
};
