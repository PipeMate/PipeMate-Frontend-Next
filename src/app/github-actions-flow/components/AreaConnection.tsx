import React, { useCallback } from "react";
import { ConnectionData, AreaNodeData } from "./AreaBasedWorkflowEditor";

interface AreaConnectionProps {
  connection: ConnectionData;
  nodes: AreaNodeData[];
  onSelect: () => void;
  isSelected: boolean;
}

export const AreaConnection: React.FC<AreaConnectionProps> = ({
  connection,
  nodes,
  onSelect,
  isSelected,
}) => {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  // 노드 위치 계산 (영역별 배치를 고려)
  const getNodePosition = useCallback(
    (node: AreaNodeData) => {
      const areaKey =
        node.type === "workflowTrigger"
          ? "trigger"
          : node.type === "job"
          ? "job"
          : "step";

      // 영역별 Y 위치 계산
      let areaY = 0;
      switch (areaKey) {
        case "trigger":
          areaY = 0;
          break;
        case "job":
          areaY = 300; // Trigger 영역 높이 + 간격
          break;
        case "step":
          // Step은 Job 내부에 있으므로 Job의 위치를 기준으로 계산
          const parentJob = nodes.find((n) => n.id === node.parentId);
          if (parentJob) {
            const jobPos = getNodePosition(parentJob);
            return {
              x: jobPos.x + 50, // Job 내부에서 오른쪽으로 오프셋
              y: jobPos.y + 100 + node.order * 60, // Job 내부에서 순서대로 배치
            };
          }
          areaY = 600; // 기본값
          break;
      }

      // 영역 내에서의 Y 위치 (순서 기반)
      const nodeY = areaY + node.order * 120; // 노드 높이 + 간격 (Job 내부 Step 고려)

      return {
        x: 200, // 고정 X 위치 (영역 중앙)
        y: nodeY + 40, // 노드 중앙
      };
    },
    [nodes]
  );

  // 연결선 그리기
  const drawConnection = useCallback(() => {
    if (!sourceNode || !targetNode) {
      return null;
    }

    const sourcePos = getNodePosition(sourceNode);
    const targetPos = getNodePosition(targetNode);

    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;

    // 화살표 크기
    const arrowSize = 8;
    const arrowAngle = Math.PI / 6; // 30도

    // 화살표 끝점 계산
    const angle = Math.atan2(dy, dx);
    const arrowPoint1 = {
      x: targetPos.x - arrowSize * Math.cos(angle - arrowAngle),
      y: targetPos.y - arrowSize * Math.sin(angle - arrowAngle),
    };
    const arrowPoint2 = {
      x: targetPos.x - arrowSize * Math.cos(angle + arrowAngle),
      y: targetPos.y - arrowSize * Math.sin(angle + arrowAngle),
    };

    return {
      line: {
        x1: sourcePos.x,
        y1: sourcePos.y,
        x2: targetPos.x,
        y2: targetPos.y,
      },
      arrow: {
        point1: arrowPoint1,
        point2: arrowPoint2,
        tip: targetPos,
      },
    };
  }, [sourceNode, targetNode, getNodePosition]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const connectionData = drawConnection();

  const getConnectionColor = () => {
    if (isSelected) return "#3b82f6";

    switch (connection.sourceType) {
      case "workflowTrigger":
        return "#3b82f6";
      case "job":
        return "#22c55e";
      case "step":
        return "#f97316";
      default:
        return "#6b7280";
    }
  };

  const getConnectionWidth = () => {
    return isSelected ? 3 : 2;
  };

  const color = getConnectionColor();
  const width = getConnectionWidth();

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      onClick={onSelect}
    >
      {/* 연결선 */}
      <line
        x1={connectionData.line.x1}
        y1={connectionData.line.y1}
        x2={connectionData.line.x2}
        y2={connectionData.line.y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        style={{
          filter: isSelected
            ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))"
            : "none",
        }}
      />

      {/* 화살표 */}
      <polygon
        points={`
          ${connectionData.arrow.tip.x},${connectionData.arrow.tip.y}
          ${connectionData.arrow.point1.x},${connectionData.arrow.point1.y}
          ${connectionData.arrow.point2.x},${connectionData.arrow.point2.y}
        `}
        fill={color}
        style={{
          filter: isSelected
            ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))"
            : "none",
        }}
      />

      {/* 선택 영역 (투명한 사각형) */}
      <rect
        x={Math.min(connectionData.line.x1, connectionData.line.x2) - 10}
        y={Math.min(connectionData.line.y1, connectionData.line.y2) - 10}
        width={Math.abs(connectionData.line.x2 - connectionData.line.x1) + 20}
        height={Math.abs(connectionData.line.y2 - connectionData.line.y1) + 20}
        fill="transparent"
        stroke="transparent"
        style={{ cursor: "pointer" }}
        onClick={onSelect}
      />
    </svg>
  );
};
