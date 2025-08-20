'use client';

import React, { useCallback } from 'react';
import { Code, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AreaNodeData } from '../../area-editor/types';
import type { ServerBlock } from '../../../types';
import { generateBlockYaml, generateFullYaml } from '../../../utils/yamlGenerator';
import { toast } from 'react-toastify';

interface YamlTabProps {
  selectedNode: AreaNodeData | null;
  blocks: ServerBlock[];
  yamlViewMode: 'block' | 'full';
  onYamlViewModeChange: (mode: 'block' | 'full') => void;
}

const YamlTab: React.FC<YamlTabProps> = ({
  selectedNode,
  blocks,
  yamlViewMode,
  onYamlViewModeChange,
}) => {
  // * YAML 생성 함수들
  const getBlockYaml = useCallback(() => {
    if (selectedNode) {
      const serverBlock: ServerBlock = {
        name: selectedNode.data.label,
        type:
          selectedNode.type === 'workflowTrigger'
            ? 'trigger'
            : (selectedNode.type as 'trigger' | 'job' | 'step'),
        description: selectedNode.data.description,
        jobName: selectedNode.data.jobName,
        config: selectedNode.data.config || {},
      };
      return generateBlockYaml(serverBlock);
    }
    return '# 블록을 선택하여 YAML을 확인하세요';
  }, [selectedNode]);

  const getFullYaml = useCallback(() => {
    if (blocks && blocks.length > 0) {
      return generateFullYaml(blocks);
    }
    return '# 워크플로우를 구성하여 YAML을 확인하세요';
  }, [blocks]);

  // * 현재 YAML 내용 가져오기
  const getCurrentYaml = useCallback(() => {
    if (yamlViewMode === 'block') {
      return getBlockYaml();
    } else {
      return getFullYaml();
    }
  }, [yamlViewMode, getBlockYaml, getFullYaml]);

  // * YAML 복사
  const copyYaml = useCallback(() => {
    const yaml = getCurrentYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      toast.success('YAML이 클립보드에 복사되었습니다.');
    });
  }, [getCurrentYaml]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {selectedNode ? (
        <>
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-orange-600" />
                <span className="text-sm font-medium text-gray-700">YAML 미리보기</span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onYamlViewModeChange('block')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                    yamlViewMode === 'block'
                      ? 'bg-white text-orange-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  블록
                </button>
                <button
                  onClick={() => onYamlViewModeChange('full')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                    yamlViewMode === 'full'
                      ? 'bg-white text-orange-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  전체
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyYaml}
                size="sm"
                className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs border-orange-600 transition-colors duration-200"
              >
                <Copy size={12} />
                복사
              </Button>
              <Button
                onClick={() => {
                  const yaml = getCurrentYaml();
                  const blob = new Blob([yaml], { type: 'text/yaml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = yamlViewMode === 'block' ? 'block.yaml' : 'workflow.yaml';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-colors duration-200"
              >
                <Download size={12} />
                다운로드
              </Button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-hidden">
            <div className="bg-slate-900 text-slate-100 font-mono text-[10px] leading-4 p-3 rounded border border-slate-800 h-full overflow-auto min-h-0">
              <pre className="whitespace-pre-wrap break-words">{getCurrentYaml()}</pre>
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <div className="p-4 text-center">
            <Code className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              YAML을 확인할 노드를 선택하세요
            </h3>
            <p className="text-sm text-gray-500">
              워크플로우에서 YAML을 확인할 블록을 클릭하면 여기서 YAML을 볼 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YamlTab;
