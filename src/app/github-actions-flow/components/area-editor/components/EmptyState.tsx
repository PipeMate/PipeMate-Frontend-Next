import React from "react";
import { Zap, Settings, Code } from "lucide-react";
import { AreaNodes } from "../types";

interface EmptyStateProps {
  areaKey: keyof AreaNodes;
  title: string;
  isDragOver: boolean;
  isJobStep?: boolean;
  jobId?: string;
}

/**
 * 빈 상태 컴포넌트
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  areaKey,
  title,
  isDragOver,
  isJobStep = false,
  jobId,
}) => {
  /**
   * 빈 상태 아이콘 가져오기
   */
  const getEmptyStateIcon = () => {
    switch (areaKey) {
      case "trigger":
        return <Zap size={20} className="text-green-500" />;
      case "job":
        return <Settings size={20} className="text-blue-500" />;
      case "step":
        return <Code size={20} className="text-yellow-500" />;
      default:
        return <Code size={20} className="text-gray-500" />;
    }
  };

  /**
   * 빈 상태 색상 가져오기
   */
  const getEmptyStateColors = () => {
    if (isDragOver) {
      switch (areaKey) {
        case "trigger":
          return "border-green-400 bg-green-50";
        case "job":
          return "border-blue-400 bg-blue-50";
        case "step":
          return "border-yellow-400 bg-yellow-50";
        default:
          return "border-gray-400 bg-gray-50";
      }
    }
    return "border-gray-300";
  };

  /**
   * 빈 상태 텍스트 색상 가져오기
   */
  const getEmptyStateTextColor = () => {
    if (isJobStep) {
      return isDragOver ? "text-orange-600 font-medium" : "text-orange-400";
    }
    return isDragOver ? "text-gray-600 font-medium" : "text-gray-400";
  };

  const textColor = getEmptyStateTextColor();
  const iconColors = isJobStep
    ? isDragOver
      ? "border-orange-400 bg-orange-50"
      : "border-orange-300"
    : getEmptyStateColors();

  return (
    <div
      className={`flex-1 h-full text-sm text-center flex items-center justify-center py-8 transition-all duration-300 ${textColor}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center ${iconColors}`}
        >
          {isJobStep ? (
            <Code size={20} className="text-orange-500" />
          ) : (
            getEmptyStateIcon()
          )}
        </div>
        <span>
          {isJobStep
            ? "Step을 여기에 드롭하세요"
            : `여기에 ${title}를 드롭하세요`}
        </span>
      </div>
    </div>
  );
};
