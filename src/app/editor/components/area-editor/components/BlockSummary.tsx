import React from 'react';
import { AreaNodeData } from '../types';
import { GitBranch, Workflow, Code, Settings, CheckCircle, Clock } from 'lucide-react';
import {
  parseTriggerConfig,
  parseJobConfig,
  parseStepConfig,
  parseStepConfigDetail,
} from '../utils/configParser';

interface BlockSummaryProps {
  node: AreaNodeData;
}

//* 긴 문자열을 적절히 줄이는 함수
const truncateString = (str: string, maxLength: number = 100): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

//* config 객체를 계층적으로 렌더링하는 함수
const renderConfigObject = (
  obj: Record<string, unknown>,
  level: number = 0,
  maxDepth: number = 3,
): React.ReactNode => {
  if (level >= maxDepth) {
    return <span className="text-xs opacity-70 font-medium">...</span>;
  }

  return (
    <div className="space-y-1">
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} className="flex items-start gap-1 text-xs">
          <span
            className="font-bold min-w-0 flex-shrink-0 text-gray-800"
            style={{ marginLeft: `${level * 8}px` }}
          >
            {key}:
          </span>
          <span className="truncate max-w-[150px] text-gray-700 font-medium">
            {typeof value === 'string'
              ? truncateString(value)
              : typeof value === 'object' && value !== null
              ? renderConfigObject(value as Record<string, unknown>, level + 1, maxDepth)
              : JSON.stringify(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const BlockSummary: React.FC<BlockSummaryProps> = ({ node }) => {
  if (!node.data.config) return null;

  switch (node.type) {
    case 'workflowTrigger':
      const triggerInfo = parseTriggerConfig(node.data.config);
      return (
        <div className="space-y-2">
          {/* 워크플로우 이름 - 핵심 정보 */}
          {triggerInfo.workflowName && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-white/60">
              <Workflow size={12} />
              <span className="text-gray-800">{triggerInfo.workflowName}</span>
            </div>
          )}

          {/* 트리거 타입들 */}
          {triggerInfo.triggers.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-90">
              {/* Play size={12} /> */}
              <span className="text-gray-700 font-medium">
                {triggerInfo.triggers.join(', ')}
              </span>
            </div>
          )}

          {/* 브랜치 정보 */}
          {triggerInfo.branches.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-85">
              <GitBranch size={12} />
              <span className="text-gray-700 font-medium">
                {triggerInfo.branches.join(', ')}
              </span>
            </div>
          )}

          {/* 경로 정보 */}
          {triggerInfo.paths.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-85">
              <Code size={12} />
              <span className="text-gray-700 font-medium">
                {triggerInfo.paths.join(', ')}
              </span>
            </div>
          )}

          {/* 추가 config 정보들 */}
          {Object.keys(node.data.config).length > 0 && (
            <div className="space-y-1">
              {Object.entries(node.data.config).map(([key, value]) => {
                // 이미 표시된 정보들은 제외
                if (['name', 'on'].includes(key)) return null;

                return (
                  <div key={key} className="flex items-start gap-1 text-xs opacity-80">
                    <span className="font-bold text-gray-800">{key}:</span>
                    <span className="truncate max-w-[150px] text-gray-700 font-medium">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    case 'job':
      const jobInfo = parseJobConfig(node.data.config);
      return (
        <div className="space-y-2">
          {/* 실행 환경 */}
          {jobInfo.runsOn.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-90">
              <Settings size={12} />
              <span className="text-gray-700 font-medium">
                {jobInfo.runsOn.join(', ')}
              </span>
            </div>
          )}

          {/* 의존성 */}
          {jobInfo.needs.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-85">
              {/* ArrowRight size={12} /> */}
              <span className="text-gray-700 font-medium">
                의존: {jobInfo.needs.join(', ')}
              </span>
            </div>
          )}

          {/* 타임아웃 */}
          {jobInfo.timeout.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-80">
              <Clock size={12} />
              <span className="text-gray-700 font-medium">
                {jobInfo.timeout.join(', ')}
              </span>
            </div>
          )}

          {/* 조건 */}
          {jobInfo.conditions.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-80">
              {/* AlertCircle size={12} /> */}
              <span className="truncate max-w-[180px] text-gray-700 font-medium">
                {jobInfo.conditions.join(', ')}
              </span>
            </div>
          )}

          {/* 추가 config 정보들 */}
          {Object.keys(node.data.config).length > 0 && (
            <div className="space-y-1">
              {Object.entries(node.data.config).map(([key, value]) => {
                // 이미 표시된 정보들은 제외
                if (['jobs', 'runs-on', 'needs', 'timeout', 'if'].includes(key))
                  return null;

                return (
                  <div key={key} className="flex items-start gap-1 text-xs opacity-80">
                    <span className="font-bold text-gray-800">{key}:</span>
                    <span className="truncate max-w-[150px] text-gray-700 font-medium">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    case 'step':
      const _stepInfo = parseStepConfig(node.data.config);
      const stepDetail = parseStepConfigDetail(node.data.config);

      return (
        <div className="space-y-2">
          {/* Action 사용 */}
          {stepDetail.uses && (
            <div className="flex items-center gap-1 text-xs opacity-90">
              <CheckCircle size={12} />
              <span className="truncate max-w-[200px] text-gray-700 font-medium">
                {stepDetail.uses}
              </span>
            </div>
          )}

          {/* 명령어 실행 */}
          {stepDetail.run && (
            <div className="flex items-center gap-1 text-xs opacity-90">
              {/* Terminal size={12} /> */}
              <span className="truncate max-w-[200px] text-gray-700 font-medium">
                {truncateString(stepDetail.run, 80)}
              </span>
            </div>
          )}

          {/* with 파라미터들 */}
          {stepDetail.with && Object.keys(stepDetail.with).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs opacity-85 font-bold">
                {/* Zap size={12} /> */}
                <span className="text-gray-800">with 파라미터:</span>
              </div>
              {renderConfigObject(stepDetail.with, 1)}
            </div>
          )}

          {/* 환경 변수 */}
          {stepDetail.env && Object.keys(stepDetail.env).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs opacity-85 font-bold">
                <Settings size={12} />
                <span className="text-gray-800">환경 변수:</span>
              </div>
              {renderConfigObject(stepDetail.env, 1)}
            </div>
          )}

          {/* 추가 설정들 */}
          <div className="space-y-1">
            {stepDetail.continueOnError !== undefined && (
              <div className="flex items-center gap-1 text-xs opacity-80">
                {/* Eye size={12} /> */}
                <span className="text-gray-700 font-medium">
                  continue-on-error: {stepDetail.continueOnError ? 'true' : 'false'}
                </span>
              </div>
            )}

            {stepDetail.if && (
              <div className="flex items-center gap-1 text-xs opacity-80">
                {/* AlertCircle size={12} /> */}
                <span className="truncate max-w-[180px] text-gray-700 font-medium">
                  if: {stepDetail.if}
                </span>
              </div>
            )}

            {stepDetail.workingDirectory && (
              <div className="flex items-center gap-1 text-xs opacity-80">
                {/* Folder size={12} /> */}
                <span className="truncate max-w-[150px] text-gray-700 font-medium">
                  working-directory: {stepDetail.workingDirectory}
                </span>
              </div>
            )}

            {stepDetail.shell && (
              <div className="flex items-center gap-1 text-xs opacity-80">
                {/* Terminal size={12} /> */}
                <span className="text-gray-700 font-medium">
                  shell: {stepDetail.shell}
                </span>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};
