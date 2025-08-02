//* 노드 타입 뱃지 컴포넌트 - 모든 노드에서 사용하는 공통 타입 표시
import { Badge } from "@/components/ui/badge";
import {
  NodeType,
  NODE_TYPE_CLASSES,
  getDomainColor,
} from "../../constants/nodeConstants";

//* 노드 타입 뱃지 Props 인터페이스
interface NodeTypeBadgeProps {
  type: NodeType;
  className?: string;
  domain?: string;
}

//* 노드 타입 뱃지 컴포넌트
export const NodeTypeBadge: React.FC<NodeTypeBadgeProps> = ({
  type,
  className,
  domain,
}) => {
  const baseClasses =
    "text-xs font-semibold px-2 py-1 rounded-full border shadow-sm transition-all duration-200 hover:scale-105";

  //* Step 노드의 경우 도메인별 색상 적용
  let typeClasses = NODE_TYPE_CLASSES[type];
  if (type === "STEP" && domain) {
    const domainColors = getDomainColor(domain);
    if (domainColors) {
      //* 도메인 색상을 Tailwind 클래스로 변환
      const colorMap: Record<string, string> = {
        github: "blue",
        java: "amber",
        gradle: "pink",
        docker: "indigo",
        aws: "orange",
      };

      const colorName = colorMap[domain] || "gray";
      typeClasses = `bg-${colorName}-100 text-${colorName}-800 border-${colorName}-200`;
    }
  }

  return (
    <Badge
      variant="secondary"
      className={`${baseClasses} ${typeClasses} ${className || ""}`}
    >
      {type}
    </Badge>
  );
};
