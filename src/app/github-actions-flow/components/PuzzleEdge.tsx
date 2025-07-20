//* 퍼즐 맞물림 형태의 커스텀 엣지 컴포넌트
"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
} from "reactflow";

interface PuzzleEdgeProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    label?: string;
  };
}

export const PuzzleEdge = memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  }: PuzzleEdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    //* 퍼즐 맞물림 효과를 위한 추가 경로 생성
    const createPuzzleConnection = () => {
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;

      //* 상단 돌출부 경로
      const topTabPath = `
        M ${midX - 10} ${midY - 15}
        L ${midX + 10} ${midY - 15}
        L ${midX + 10} ${midY - 5}
        L ${midX + 5} ${midY}
        L ${midX - 5} ${midY}
        L ${midX - 10} ${midY - 5}
        Z
      `;

      //* 하단 홈 경로
      const bottomSlotPath = `
        M ${midX - 10} ${midY + 5}
        L ${midX + 10} ${midY + 5}
        L ${midX + 10} ${midY + 15}
        L ${midX - 10} ${midY + 15}
        Z
      `;

      return { topTabPath, bottomSlotPath };
    };

    const { topTabPath, bottomSlotPath } = createPuzzleConnection();

    return (
      <>
        {/* 메인 엣지 경로 */}
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: "#4c1d95",
            strokeWidth: 3,
            strokeDasharray: "none",
          }}
        />

        {/* 퍼즐 맞물림 효과 - 상단 돌출부 */}
        <path
          d={topTabPath}
          fill="#4c1d95"
          stroke="#4c1d95"
          strokeWidth="1"
          className="puzzle-tab"
        />

        {/* 퍼즐 맞물림 효과 - 하단 홈 */}
        <path
          d={bottomSlotPath}
          fill="transparent"
          stroke="#4c1d95"
          strokeWidth="2"
          strokeDasharray="3,3"
          className="puzzle-slot"
        />

        {/* 연결점 강조 효과 */}
        <circle
          cx={sourceX}
          cy={sourceY}
          r="4"
          fill="#4c1d95"
          stroke="#fff"
          strokeWidth="2"
          className="puzzle-connection-point"
        />
        <circle
          cx={targetX}
          cy={targetY}
          r="4"
          fill="#4c1d95"
          stroke="#fff"
          strokeWidth="2"
          className="puzzle-connection-point"
        />

        {/* 엣지 라벨 렌더러 */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            {data?.label && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #4c1d95",
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#4c1d95",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {data.label}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

PuzzleEdge.displayName = "PuzzleEdge";
