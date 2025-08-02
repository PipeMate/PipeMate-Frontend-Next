//* 서브플로우 노드 컴포넌트 - Step들을 담는 컨테이너 노드
//* Job과 1:1 관계를 가지며, Step 노드들을 포함하는 컨테이너 역할
import BaseNode from "./BaseNode";
import { Position, NodeProps } from "@xyflow/react";
import { NodeContext } from "./BaseNode";
import { NodeTypeBadge } from "./NodeTypeBadge";
import {
  NODE_COLORS,
  NODE_HANDLE_CONFIGS,
  getNodeIcon,
  NODE_TITLES,
} from "../../constants/nodeConstants";

//* 서브플로우 노드 데이터 인터페이스 - Step 개수와 크기 정보 포함
interface SubFlowNodeData {
  label: string; //* 노드 제목
  type: string; //* 노드 타입
  jobId: string; //* 연결된 Job의 ID
  stepCount?: number; //* 포함된 Step 개수
  width: number; //* 노드 너비
  height: number; //* 노드 높이
}

//* 서브플로우 노드 컴포넌트 - Step 컨테이너 역할
export const SubFlowNode: React.FC<NodeProps> = ({ data, id }) => {
  //* 노드 데이터 타입 캐스팅
  const nodeData = data as unknown as SubFlowNodeData;

  //* 핸들 설정 - 서브플로우 노드의 연결점 정의
  const handles = NODE_HANDLE_CONFIGS.STEPS.map((handle) => ({
    ...handle,
    position: handle.position as Position,
  }));

  //* SubFlowNode 전용 색상 - 노란색 계열로 구분
  const colors = NODE_COLORS.STEPS;

  //* Step 개수에 따른 제목 생성
  const getTitle = () => {
    if (nodeData.stepCount && nodeData.stepCount > 0) {
      return `Steps Container (${nodeData.stepCount} steps)`;
    }
    return "Steps Container";
  };

  return (
    <NodeContext.Provider value={{}}>
      <BaseNode
        icon={getNodeIcon("STEPS")}
        title={getTitle()}
        description="Step들을 담는 컨테이너"
        handles={handles}
        bgColor={colors.bg}
        borderColor={colors.border}
        textColor={colors.text}
        style={{ minHeight: nodeData.height || 120 }} //* 동적 높이 설정
        nodeTypeBadge={<NodeTypeBadge type="STEPS" />} //* 노드 타입 뱃지
      >
        <div className="flex flex-col gap-1 w-full">
          {/* 내용 영역 - Step 개수 표시 */}
          <div className="text-[11px] leading-[1.3] opacity-80 w-full">
            {nodeData.stepCount && nodeData.stepCount > 0 ? (
              //* Step이 있는 경우 개수 표시
              <span className="font-bold" style={{ color: colors.text }}>
                {nodeData.stepCount}개의 Step이 포함되어 있습니다
              </span>
            ) : (
              //* Step이 없는 경우 안내 메시지
              <span className="italic opacity-60">
                Step 노드들을 여기에 추가하세요
              </span>
            )}
          </div>
        </div>
      </BaseNode>
    </NodeContext.Provider>
  );
};
