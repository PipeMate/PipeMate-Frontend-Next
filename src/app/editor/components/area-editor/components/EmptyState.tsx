import React from 'react';
import { Zap, Settings, Code } from 'lucide-react';
import { AreaNodes } from '../types';

interface EmptyStateProps {
  areaKey: keyof AreaNodes;
  title: string;
  isDragOver: boolean;
  isJobStep?: boolean;
  jobId?: string;
}

// * 빈 상태 컴포넌트
// * 간단하고 일관된 높이를 유지합니다.
export const EmptyState: React.FC<EmptyStateProps> = ({
  areaKey,
  title,
  isDragOver,
  isJobStep,
  jobId: _jobId,
}) => {
  // * 빈 상태 아이콘 가져오기
  const getEmptyStateIcon = () => {
    switch (areaKey) {
      case 'trigger':
        return <Zap size={20} className="text-green-500" />;
      case 'job':
        return <Settings size={20} className="text-blue-500" />;
      case 'step':
        return <Code size={20} className="text-yellow-500" />;
      default:
        return <Code size={20} className="text-gray-500" />;
    }
  };

  // * 빈 상태 색상 가져오기
  const getEmptyStateColors = () => {
    if (isDragOver) {
      switch (areaKey) {
        case 'trigger':
          return 'border-green-400 bg-green-50';
        case 'job':
          return 'border-blue-400 bg-blue-50';
        case 'step':
          return 'border-yellow-400 bg-yellow-50';
        default:
          return 'border-gray-400 bg-gray-50';
      }
    }
    return 'border-gray-300 bg-gray-50/30';
  };

  // * 간단한 안내 메시지
  const getMessage = () => {
    if (isJobStep) {
      return isDragOver ? 'Step을 여기에 놓으세요' : 'Step을 여기에 드롭하세요';
    }

    switch (areaKey) {
      case 'trigger':
        return isDragOver ? 'Trigger를 여기에 놓으세요' : 'Trigger를 여기에 드롭하세요';
      case 'job':
        return isDragOver ? 'Job을 여기에 놓으세요' : 'Job을 여기에 드롭하세요';
      case 'step':
        return isDragOver ? 'Step을 여기에 놓으세요' : 'Step을 여기에 드롭하세요';
      default:
        return isDragOver ? '블록을 여기에 놓으세요' : '블록을 여기에 드롭하세요';
    }
  };

  const iconColors = isJobStep
    ? isDragOver
      ? 'border-orange-400 bg-orange-50'
      : 'border-orange-300 bg-orange-50/30'
    : getEmptyStateColors();

  return (
    <div className="flex-1 h-full text-sm text-center flex items-center justify-center py-6 transition-all duration-300">
      <div className="flex flex-col items-center gap-3 max-w-xs">
        {/* 메인 아이콘 */}
        <div
          className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ${iconColors}`}
        >
          {isJobStep ? (
            <Code size={20} className="text-orange-500" />
          ) : (
            getEmptyStateIcon()
          )}
        </div>

        {/* 간단한 메시지 */}
        <span className="font-medium text-gray-600">{getMessage()}</span>
      </div>
    </div>
  );
};
