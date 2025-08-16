//* ========================================
//* 커스텀 타입 정의 (React Flow 대체)
//* ========================================
//* 이 파일은 @xyflow/react의 타입들을 대체하는 커스텀 타입들을 정의합니다.

//* ========================================
//* 기본 타입 정의
//* ========================================

//* 노드 위치 타입
export interface Position {
  x: number;
  y: number;
}

//* 노드 타입
export interface CustomNode {
  id: string;
  type: string;
  position: Position;
  parentId?: string;
  data: Record<string, unknown>;
  style?: React.CSSProperties;
  draggable?: boolean;
}

//* 엣지 타입
export interface CustomEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, unknown>;
  style?: React.CSSProperties;
  markerEnd?: {
    type: string;
    width: number;
    height: number;
    color: string;
  };
}

//* ========================================
//* 상수 정의
//* ========================================

//* 마커 타입 상수
export const MarkerType = {
  ArrowClosed: 'arrowclosed',
  Arrow: 'arrow',
} as const;

//* 엣지 타입 상수
export const EdgeType = {
  Straight: 'straight',
  SmoothStep: 'smoothstep',
  Step: 'step',
} as const;

//* ========================================
//* 타입 가드 함수
//* ========================================

//* CustomNode 타입 가드
export const isCustomNode = (obj: unknown): obj is CustomNode => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'position' in obj &&
    'data' in obj
  );
};

//* CustomEdge 타입 가드
export const isCustomEdge = (obj: unknown): obj is CustomEdge => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'source' in obj &&
    'target' in obj
  );
};

//* ========================================
//* 유틸리티 함수
//* ========================================

//* 노드 생성 헬퍼 함수
export const createCustomNode = (
  id: string,
  type: string,
  position: Position,
  data: Record<string, unknown>,
  parentId?: string,
): CustomNode => ({
  id,
  type,
  position,
  parentId,
  data,
  draggable: true,
});

//* 엣지 생성 헬퍼 함수
export const createCustomEdge = (
  id: string,
  source: string,
  target: string,
  type: string = EdgeType.Straight,
  data?: Record<string, unknown>,
): CustomEdge => ({
  id,
  source,
  target,
  type,
  data,
  style: { zIndex: 10 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: '#64748b',
  },
});
