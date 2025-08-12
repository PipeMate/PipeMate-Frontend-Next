import React from 'react';
import { Zap, Settings, Code, Info, ArrowDown, Plus } from 'lucide-react';
import { AreaNodes } from '../types';

interface EmptyStateProps {
  areaKey: keyof AreaNodes;
  title: string;
  isDragOver: boolean;
  isJobStep?: boolean;
  jobId?: string;
}

/**
 * 빈 상태 컴포넌트
 * 사용자에게 명확한 안내와 가이드를 제공합니다.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  areaKey,
  title,
  isDragOver,
  isJobStep,
  jobId: _jobId,
}) => {
  /**
   * 빈 상태 아이콘 가져오기
   */
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

  /**
   * 빈 상태 색상 가져오기
   */
  const getEmptyStateColors = () => {
    if (isDragOver) {
      switch (areaKey) {
        case 'trigger':
          return 'border-green-400 bg-green-50 ring-2 ring-green-200';
        case 'job':
          return 'border-blue-400 bg-blue-50 ring-2 ring-blue-200';
        case 'step':
          return 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-200';
        default:
          return 'border-gray-400 bg-gray-50 ring-2 ring-gray-200';
      }
    }
    return 'border-gray-300 bg-gray-50/30';
  };

  /**
   * 빈 상태 텍스트 색상 가져오기
   */
  const getEmptyStateTextColor = () => {
    if (isJobStep) {
      return isDragOver ? 'text-orange-600 font-medium' : 'text-orange-500';
    }
    return isDragOver ? 'text-gray-700 font-medium' : 'text-gray-500';
  };

  /**
   * 영역별 안내 메시지 가져오기
   */
  const getGuideMessage = () => {
    if (isJobStep) {
      return {
        primary: 'Step을 여기에 드롭하세요',
        secondary: '워크플로우의 실행 단계를 정의합니다',
        hint: '사이드바에서 Step 블록을 드래그하여 추가하세요'
      };
    }

    switch (areaKey) {
      case 'trigger':
        return {
          primary: 'Trigger를 여기에 드롭하세요',
          secondary: '워크플로우 실행 조건을 설정합니다',
          hint: '예: push, pull_request, schedule 등'
        };
      case 'job':
        return {
          primary: 'Job을 여기에 드롭하세요',
          secondary: '실행할 작업을 정의합니다',
          hint: '하나의 Job에 여러 Step을 포함할 수 있습니다'
        };
      case 'step':
        return {
          primary: 'Step을 여기에 드롭하세요',
          secondary: '구체적인 실행 단계를 정의합니다',
          hint: '명령어, 스크립트, 액션 등을 실행합니다'
        };
      default:
        return {
          primary: `여기에 ${title}를 드롭하세요`,
          secondary: '블록을 드래그하여 추가하세요',
          hint: '사이드바에서 원하는 블록을 선택하세요'
        };
    }
  };

  /**
   * 드래그 오버 시 추가 안내 메시지
   */
  const getDragOverMessage = () => {
    if (isJobStep) {
      return 'Step 블록을 여기에 놓으세요';
    }

    switch (areaKey) {
      case 'trigger':
        return 'Trigger 블록을 여기에 놓으세요';
      case 'job':
        return 'Job 블록을 여기에 놓으세요';
      case 'step':
        return 'Step 블록을 여기에 놓으세요';
      default:
        return '블록을 여기에 놓으세요';
    }
  };

  const textColor = getEmptyStateTextColor();
  const iconColors = isJobStep
    ? isDragOver
      ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200'
      : 'border-orange-300 bg-orange-50/30'
    : getEmptyStateColors();

  const guideMessage = getGuideMessage();
  const dragOverMessage = getDragOverMessage();

  return (
    <div
      className={`flex-1 h-full text-sm text-center flex items-center justify-center py-8 transition-all duration-300 ${textColor}`}
    >
      <div className="flex flex-col items-center gap-4 max-w-xs">
        {/* 메인 아이콘 */}
        <div
          className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ${iconColors}`}
        >
          {isJobStep ? (
            <Code size={24} className="text-orange-500" />
          ) : (
            getEmptyStateIcon()
          )}
        </div>

        {/* 메인 메시지 */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium text-base">
            {isDragOver ? dragOverMessage : guideMessage.primary}
          </span>
          
          {/* 부가 설명 */}
          {!isDragOver && (
            <span className="text-xs opacity-75">
              {guideMessage.secondary}
            </span>
          )}
        </div>

        {/* 힌트 메시지 */}
        {!isDragOver && (
          <div className="flex items-center gap-2 text-xs opacity-60">
            <Info size={14} />
            <span>{guideMessage.hint}</span>
          </div>
        )}

        {/* 드래그 오버 시 시각적 피드백 */}
        {isDragOver && (
          <div className="flex items-center gap-2 text-xs font-medium animate-pulse">
            <ArrowDown size={14} />
            <span>드롭하여 추가</span>
          </div>
        )}

        {/* 추가 안내 (Job 영역의 경우) */}
        {areaKey === 'job' && !isDragOver && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Plus size={12} />
              <span>Job 내부에 Step을 추가할 수 있습니다</span>
            </div>
          </div>
        )}

        {/* 접근성 안내 */}
        {!isDragOver && (
          <div className="mt-2 text-xs opacity-50">
            <span>💡 키보드로 Tab 키를 사용하여 탐색할 수 있습니다</span>
          </div>
        )}
      </div>
    </div>
  );
};
