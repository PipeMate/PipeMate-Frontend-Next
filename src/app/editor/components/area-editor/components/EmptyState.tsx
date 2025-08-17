import React from 'react';
import { Zap, Settings, Code, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaNodes } from '../types';

interface EmptyStateProps {
  areaKey: keyof AreaNodes;
  title: string;
  isDragOver: boolean;
  isJobStep?: boolean;
  jobId?: string;
  onCreateDefaultBlock?: () => void;
}

// * 빈 상태 컴포넌트
// * 간단하고 일관된 높이를 유지합니다.
export const EmptyState: React.FC<EmptyStateProps> = ({
  areaKey,
  title,
  isDragOver,
  isJobStep,
  jobId: _jobId,
  onCreateDefaultBlock,
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

  // * 버튼 색상 가져오기
  const getButtonVariant = () => {
    if (isJobStep) {
      return 'outline' as const;
    }

    switch (areaKey) {
      case 'trigger':
        return 'default' as const;
      case 'job':
        return 'default' as const;
      case 'step':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  // * 버튼 스타일 가져오기
  const getButtonStyle = () => {
    if (isJobStep) {
      return 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400';
    }

    switch (areaKey) {
      case 'trigger':
        return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
      case 'job':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      case 'step':
        return 'border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400';
      default:
        return 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400';
    }
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

  // * 버튼 텍스트 가져오기
  const getButtonText = () => {
    if (isJobStep) {
      return 'Step 추가';
    }

    switch (areaKey) {
      case 'trigger':
        return 'Trigger 추가';
      case 'job':
        return 'Job 추가';
      case 'step':
        return 'Step 추가';
      default:
        return '블록 추가';
    }
  };

  const iconColors = isJobStep
    ? isDragOver
      ? 'border-orange-400 bg-orange-50'
      : 'border-orange-300 bg-orange-50/30'
    : getEmptyStateColors();

  return (
    <div className="flex-1 h-full text-sm text-center flex items-center justify-center py-6 transition-all duration-300">
      <div className="flex flex-col items-center gap-4 max-w-xs">
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

        {/* 기본 블록 생성 버튼 */}
        {onCreateDefaultBlock && (
          <Button
            onClick={onCreateDefaultBlock}
            variant={getButtonVariant()}
            size="sm"
            className={`${getButtonStyle()} transition-all duration-200`}
          >
            <Plus size={16} className="mr-1" />
            {getButtonText()}
          </Button>
        )}
      </div>
    </div>
  );
};
