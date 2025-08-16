'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AreaNodeData } from './area-editor/types';
import { ServerBlock } from '../types';
import { WorkflowNodeData } from '../types';
import { NodeType } from './area-editor/types';
import { generateBlockYaml, generateFullYaml } from '../utils/yamlGenerator';
import { parseYamlToConfigStrict, formatYaml } from '../utils/yamlUtils';
import { useCreatePipeline } from '@/api';
import { useRepository } from '@/contexts/RepositoryContext';
import { toast } from 'react-toastify';
import { GithubTokenDialog } from '@/components/features/GithubSettingsDialog';

import { SecretManagementPanel } from './SecretManagementPanel';
import {
  Settings,
  Save,
  Eye,
  Trash2,
  Copy,
  Download,
  X,
  Plus,
  Minus,
  Code,
  Layers,
  Palette,
  Lock,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecrets, useCreateOrUpdateSecret } from '@/api';
import {
  detectSecretsInConfig,
  canNodeUseSecrets,
  findMissingSecrets,
} from '../utils/secretsDetector';

//* ========================================
//* Props 타입 정의
//* ========================================

interface IntegratedSidePanelProps {
  selectedNode: AreaNodeData | null;
  blocks: ServerBlock[];
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkflow: () => void;
  onClearWorkspace: () => void;
  onNodeSelect: (node: AreaNodeData) => void;
  onNodeEdit: (node: AreaNodeData) => void;
  onNodeDelete: (nodeId: string) => void;
  onBlockUpdate?: (updatedBlock: ServerBlock) => void;
  hasNodes: boolean;
  updateNodeData?: (nodeId: string, data: WorkflowNodeData) => void;
  mode?: 'create' | 'edit';
  initialWorkflowName?: string;
  onWorkflowNameChange?: (name: string) => void;
}

//* ========================================
//* 워크플로우 구조 타입 정의
//* ========================================

// 트리 탭 제거됨: 관련 타입 제거

//* ========================================
//* Config 필드 타입 정의
//* ========================================

interface ConfigField {
  key: string;
  value: string | object | string[];
  type: 'string' | 'object' | 'array';
  isExpanded?: boolean;
  children?: ConfigField[];
}

//* ========================================
//* 워크플로우 구조 분석 함수
//* ========================================

// 트리 탭 제거됨: 분석 함수 제거

//* ========================================
//* 트리 뷰 컴포넌트
//* ========================================

// 트리 탭 제거됨: 트리 컴포넌트 제거

//* ========================================
//* 노드 에디터 컴포넌트
//* ========================================

interface NodeEditorProps {
  nodeData: WorkflowNodeData;
  nodeType: NodeType;
  onSave: (updatedData: WorkflowNodeData) => void;
  onCancel: () => void;
  onMissingSecrets?: (missing: string[]) => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeData,
  nodeType,
  onSave,
  onCancel: _onCancel,
  onMissingSecrets,
}) => {
  const { owner, repo } = useRepository();
  const [editedData, setEditedData] = useState<WorkflowNodeData>(nodeData);
  const [configText, setConfigText] = useState<string>('');
  const [configError, setConfigError] = useState<string>('');
  // preview is not used in compact panel
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  // secrets 경고 배지/다이얼로그에서만 사용
  // duplicate removed; use the state in the panel scope

  // Secrets API 훅
  const { data: secretsData, refetch: refetchSecrets } = useSecrets(
    owner || '',
    repo || '',
  );

  // nodeData 변경 감지를 위한 메모이제이션
  const nodeDataKey = useMemo(() => {
    return `${JSON.stringify(nodeData)}-${JSON.stringify(nodeData.config)}`;
  }, [nodeData]);

  // 초기 데이터 설정 (무한 렌더링 방지)
  useEffect(() => {
    setEditedData(nodeData);
    setConfigText(JSON.stringify(nodeData.config, null, 2));
    setConfigError('');
    const fields = parseConfigFields(nodeData.config);
    setConfigFields(fields);
  }, [nodeDataKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 도메인/태스크 자동 추론
  const inferDomainAndTask = useCallback((config: Record<string, unknown>) => {
    const result: { domain?: string; task?: string[] } = {};
    const uses = typeof config?.uses === 'string' ? (config.uses as string) : undefined;
    const run = typeof config?.run === 'string' ? (config.run as string) : undefined;

    if (uses) {
      if (uses.startsWith('actions/')) {
        result.domain = 'github';
        const actionName = uses.split('/')[1]?.split('@')[0] || 'action';
        result.task = [actionName];
      } else if (uses.includes('docker')) {
        result.domain = 'docker';
        result.task = ['docker'];
      }
    }

    if (!result.domain && run) {
      if (/\b(mvn|maven|gradle)\b/i.test(run)) {
        result.domain = 'java';
        const tasks: string[] = [];
        if (/gradle\s+(build|test|publish)/i.test(run)) {
          const m = run.match(/gradle\s+(build|test|publish)/i);
          if (m) tasks.push(m[1].toLowerCase());
        }
        if (/mvn\s+([a-z:-]+)/i.test(run)) {
          const m = run.match(/mvn\s+([a-z:-]+)/i);
          if (m) tasks.push(m[1].toLowerCase());
        }
        if (tasks.length > 0) result.task = tasks;
      } else if (/\b(npm|yarn|pnpm)\b/i.test(run)) {
        result.domain = 'node';
        const m = run.match(/\b(npm|yarn|pnpm)\s+(run\s+)?([a-zA-Z0-9:_-]+)/i);
        if (m && m[3]) result.task = [m[3].toLowerCase()];
      } else if (/\bpython\b|pip|poetry/i.test(run)) {
        result.domain = 'python';
      }
    }

    return result;
  }, []);

  // step 기본 메타 자동완성 (미설정 시에만) - 무한 렌더링 방지
  useEffect(() => {
    if (nodeType === 'step' && editedData.config) {
      const needsDomain = !editedData.domain || editedData.domain.trim() === '';
      const needsTask = !editedData.task || editedData.task.length === 0;

      if (needsDomain || needsTask) {
        const inferred = inferDomainAndTask(editedData.config);
        const shouldUpdate =
          (needsDomain && inferred.domain) || (needsTask && inferred.task);

        if (shouldUpdate) {
          setEditedData((prev) => ({
            ...prev,
            ...(needsDomain && inferred.domain ? { domain: inferred.domain } : {}),
            ...(needsTask && inferred.task ? { task: inferred.task } : {}),
          }));
        }
      }
    }
  }, [
    nodeType,
    editedData.label,
    editedData.domain,
    editedData.task,
    JSON.stringify(editedData.config),
    inferDomainAndTask,
  ]);

  // Config 변경 시 secrets 감지 (캐시 문제 해결을 위한 개선)
  useEffect(() => {
    if (canNodeUseSecrets(nodeType) && editedData.config) {
      const requiredSecrets = detectSecretsInConfig(editedData.config);
      // API 응답 구조에 맞게 수정 (groupedSecrets 사용)
      const userSecrets: string[] = [];
      if (secretsData?.data?.groupedSecrets) {
        Object.values(secretsData.data.groupedSecrets).forEach((group: unknown) => {
          if (Array.isArray(group)) {
            group.forEach((secret: unknown) => {
              if (
                secret &&
                typeof secret === 'object' &&
                'name' in secret &&
                typeof secret.name === 'string'
              ) {
                userSecrets.push(secret.name);
              }
            });
          }
        });
      }

      // console.log('🔍 시크릿 감지 디버그:', {
      //   requiredSecrets,
      //   userSecrets,
      //   secretsDataStructure: secretsData?.data,
      //   missing: findMissingSecrets(requiredSecrets, userSecrets),
      // });

      const missing = findMissingSecrets(requiredSecrets, userSecrets);

      // 누락된 시크릿이 있지만 최근에 생성되었을 가능성이 있으면 재시도
      if (missing.length > 0 && requiredSecrets.length > 0) {
        // 2초 후 한 번 더 확인 (시크릿 생성 직후의 캐시 지연 대응)
        const retryTimer = setTimeout(async () => {
          try {
            await refetchSecrets();
            // console.log('🔄 시크릿 목록 재확인 완료');
          } catch (error) {
            console.warn('시크릿 재확인 실패:', error);
          }
        }, 2000);

        // 컴포넌트 언마운트 시 타이머 정리
        return () => clearTimeout(retryTimer);
      }

      // 누락된 secrets가 있으면 토스트 표시 (첫 번째 감지에서만)
      if (missing.length > 0) {
        toast.warning(
          `${missing.length}개의 Secret이 누락되었습니다. 설정에서 확인하세요.`,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          },
        );
      }
    }
  }, [JSON.stringify(editedData.config), nodeType, secretsData, refetchSecrets]);

  // config 필드 파싱 (재귀적으로 중첩 객체 처리)
  const parseConfigFields = React.useCallback(
    (config: Record<string, unknown>): ConfigField[] => {
      const fields: ConfigField[] = [];

      Object.entries(config).forEach(([key, value]) => {
        let type: 'string' | 'object' | 'array' = 'string';
        let children: ConfigField[] | undefined;

        if (Array.isArray(value)) {
          type = 'array';
        } else if (value && typeof value === 'object') {
          type = 'object';
          // 중첩된 객체의 경우 재귀적으로 파싱
          children = parseConfigFields(value as Record<string, unknown>);
        }

        fields.push({
          key,
          value: value as string | object | string[],
          type,
          isExpanded: false,
          children,
        });
      });

      return fields;
    },
    [],
  );

  // 타입별 고정 라벨 정의
  const getFixedLabels = (type: NodeType) => {
    switch (type) {
      case 'workflowTrigger':
        return {
          name: '워크플로우 기본 설정',
          description:
            'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
        };
      case 'job':
        return {
          name: 'Job 설정',
          description: '사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.',
        };
      case 'step':
        return {
          name: 'Step 설정',
          description: '워크플로우 실행 단계를 설정하는 블록입니다.',
        };
      default:
        return { name: '', description: '' };
    }
  };

  // 타입별 편집 가능한 필드 정의
  const getEditableFields = (type: NodeType) => {
    switch (type) {
      case 'workflowTrigger':
        return ['label'];
      case 'job':
        return ['label', 'jobName'];
      case 'step':
        return ['label', 'jobName', 'domain', 'task'];
      default:
        return [];
    }
  };

  // config 유효성 검사
  const validateConfig = (configStr: string): boolean => {
    try {
      JSON.parse(configStr);
      setConfigError('');
      return true;
    } catch {
      setConfigError('유효하지 않은 JSON 형식입니다.');
      return false;
    }
  };

  // 중첩된 필드 값 변경
  const handleConfigFieldChange = (
    index: number,
    value: string | object | string[],
    parentIndex?: number,
  ) => {
    const newFields = [...configFields];

    if (parentIndex !== undefined) {
      const parent = newFields[parentIndex];
      if (parent.children) {
        parent.children[index].value = value;
        const parentValue: Record<string, unknown> = {};
        parent.children.forEach((child) => {
          parentValue[child.key] = child.value;
        });
        parent.value = parentValue;
      }
    } else {
      newFields[index].value = value;
    }

    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 필드에서 config 업데이트
  const updateConfigFromFields = (fields: ConfigField[]) => {
    const newConfig: Record<string, unknown> = {};

    fields.forEach((field) => {
      if (field.type === 'object' && field.children) {
        const nestedConfig: Record<string, unknown> = {};
        field.children.forEach((child) => {
          nestedConfig[child.key] = child.value;
        });
        newConfig[field.key] = nestedConfig;
      } else {
        newConfig[field.key] = field.value;
      }
    });

    setEditedData((prev) => ({
      ...prev,
      config: newConfig,
    }));

    setConfigText(JSON.stringify(newConfig, null, 2));
  };

  // 필드 확장/축소 토글
  const toggleFieldExpansion = (index: number) => {
    const newFields = [...configFields];
    newFields[index].isExpanded = !newFields[index].isExpanded;
    setConfigFields(newFields);
  };

  // 동적 필드 추가
  const handleAddConfigField = () => {
    const newField: ConfigField = {
      key: `field_${configFields.length + 1}`,
      value: '',
      type: 'string',
    };
    const newFields = [...configFields, newField];
    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 동적 필드 삭제
  const handleRemoveConfigField = (index: number) => {
    const newFields = configFields.filter((_, i) => i !== index);
    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!validateConfig(configText)) {
      return;
    }

    try {
      const config = JSON.parse(configText);
      const updatedData: WorkflowNodeData = {
        ...editedData,
        config,
      };
      onSave(updatedData);
      toast.success('노드가 저장되었습니다.');

      // 저장 시 시크릿 누락 확인 후, 별도 편집창 열기
      if (canNodeUseSecrets(nodeType)) {
        const required = detectSecretsInConfig(config);
        const existing: string[] = [];
        if (secretsData?.data?.groupedSecrets) {
          Object.values(secretsData.data.groupedSecrets).forEach((group: unknown) => {
            if (Array.isArray(group)) {
              group.forEach((secret: unknown) => {
                if (
                  secret &&
                  typeof secret === 'object' &&
                  'name' in secret &&
                  typeof secret.name === 'string'
                ) {
                  existing.push(secret.name);
                }
              });
            }
          });
        }
        const missing = findMissingSecrets(required, existing);
        if (missing.length > 0 && onMissingSecrets) {
          onMissingSecrets(missing);
        }
      }
    } catch {
      setConfigError('설정 저장 중 오류가 발생했습니다.');
    }
  };

  // 필드 값 렌더링
  const renderFieldValue = (field: ConfigField, index: number, parentIndex?: number) => {
    switch (field.type) {
      case 'string':
        return (
          <Input
            value={String(field.value)}
            onChange={(e) => handleConfigFieldChange(index, e.target.value, parentIndex)}
            placeholder="값을 입력하세요"
            className="mt-1"
          />
        );
      case 'object':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFieldExpansion(index)}
                className="p-1"
              >
                {field.isExpanded ? (
                  <span className="text-xs text-gray-500">접기</span>
                ) : (
                  <span className="text-xs text-gray-500">펼치기</span>
                )}
              </Button>
              <span className="text-xs text-gray-500">객체 (클릭하여 확장)</span>
            </div>
            {field.isExpanded && field.children && (
              <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                {field.children.map((child, childIndex) => (
                  <div key={childIndex} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={child.key}
                          onChange={(e) => {
                            const newFields = [...configFields];
                            if (newFields[index].children) {
                              newFields[index].children![childIndex].key = e.target.value;
                              setConfigFields(newFields);
                              updateConfigFromFields(newFields);
                            }
                          }}
                          className="w-32 text-sm"
                          placeholder="필드명"
                        />
                        <Badge variant="outline" className="text-xs">
                          {child.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus size={14} />
                      </Button>
                    </div>
                    {renderFieldValue(child, childIndex, index)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'array':
        return (
          <Input
            value={
              Array.isArray(field.value) ? field.value.join(', ') : String(field.value)
            }
            onChange={(e) => {
              const values = e.target.value.split(',').map((v) => v.trim());
              handleConfigFieldChange(index, values, parentIndex);
            }}
            placeholder="쉼표로 구분하여 입력하세요"
            className="mt-1"
          />
        );
      default:
        return (
          <Input
            value={String(field.value)}
            onChange={(e) => handleConfigFieldChange(index, e.target.value, parentIndex)}
            placeholder="값을 입력하세요"
            className="mt-1"
          />
        );
    }
  };

  const fixedLabels = getFixedLabels(nodeType);
  const editableFields = getEditableFields(nodeType);

  return (
    <div className="space-y-6">
      {/* 고정 필드 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-blue-600" />
          <h3 className="text-sm font-medium text-gray-700">고정 정보</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">이름</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
              {fixedLabels.name}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">설명</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
              {fixedLabels.description}
            </div>
          </div>
        </div>
      </div>

      {/* 편집 가능한 필드 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Edit size={16} className="text-green-600" />
          <h3 className="text-sm font-medium text-gray-700">편집 가능한 정보</h3>
        </div>
        <div className="space-y-3">
          {/* 라벨 */}
          {editableFields.includes('label') && (
            <div>
              <label className="text-xs font-medium text-gray-600">표시 이름</label>
              <Input
                value={editedData.label}
                onChange={(e) => setEditedData({ ...editedData, label: e.target.value })}
                placeholder="노드 표시 이름을 입력하세요"
                className="mt-1"
              />
            </div>
          )}

          {/* Job 이름 */}
          {editableFields.includes('jobName') && (
            <div>
              <label className="text-xs font-medium text-gray-600">Job 이름</label>
              <Input
                value={editedData.jobName || ''}
                onChange={(e) =>
                  setEditedData({ ...editedData, jobName: e.target.value })
                }
                placeholder="jobName을 입력하세요"
                className="mt-1"
              />
            </div>
          )}

          {/* 도메인 */}
          {editableFields.includes('domain') && (
            <div>
              <label className="text-xs font-medium text-gray-600">도메인</label>
              <Input
                value={editedData.domain || ''}
                onChange={(e) => setEditedData({ ...editedData, domain: e.target.value })}
                placeholder="도메인을 입력하세요 (예: github, java, docker)"
                className="mt-1"
              />
            </div>
          )}

          {/* 태스크 */}
          {editableFields.includes('task') && (
            <div>
              <label className="text-xs font-medium text-gray-600">
                태스크 (쉼표로 구분)
              </label>
              <Input
                value={editedData.task?.join(', ') || ''}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    task: e.target.value.split(',').map((t) => t.trim()),
                  })
                }
                placeholder="태스크를 쉼표로 구분하여 입력하세요 (예: checkout, build)"
                className="mt-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Config 편집 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-purple-600" />
          <h3 className="text-sm font-medium text-gray-700">설정 (Config)</h3>
        </div>
        <Tabs defaultValue="fields">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">동적 필드 편집</TabsTrigger>
            <TabsTrigger value="json">JSON 편집</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            <div className="space-y-3">
              {configFields.map((field, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={field.key}
                        onChange={(e) => {
                          const newFields = [...configFields];
                          newFields[index].key = e.target.value;
                          setConfigFields(newFields);
                          updateConfigFromFields(newFields);
                        }}
                        className="w-32 text-sm"
                        placeholder="필드명"
                      />
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveConfigField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  {renderFieldValue(field, index)}
                </div>
              ))}
              <Button variant="outline" onClick={handleAddConfigField} className="w-full">
                <Plus size={14} className="mr-1" />
                필드 추가
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="json">
            <div className="space-y-2">
              <span className="text-xs text-gray-600">JSON 형식으로 직접 편집</span>
              <textarea
                value={configText}
                onChange={(e) => {
                  setConfigText(e.target.value);
                  validateConfig(e.target.value);
                }}
                className="w-full h-32 p-3 border rounded font-mono text-xs"
                placeholder="JSON 형식으로 설정을 입력하세요"
              />
              {configError && <div className="text-xs text-red-500">{configError}</div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 저장 버튼 */}
      <Button onClick={handleSave} disabled={!!configError} className="w-full">
        <Save size={16} className="mr-2" />
        저장
      </Button>
    </div>
  );
};

//* ========================================
//* 통합 사이드 패널 컴포넌트
//* ========================================

export const IntegratedSidePanel: React.FC<IntegratedSidePanelProps> = ({
  selectedNode,
  blocks,
  isOpen,
  onClose,
  onSaveWorkflow,
  onClearWorkspace,
  onNodeSelect: _onNodeSelect,
  onNodeEdit: _onNodeEdit,
  onNodeDelete,
  onBlockUpdate,
  hasNodes,
  updateNodeData,
  mode = 'create',
  initialWorkflowName,
  onWorkflowNameChange,
}) => {
  const { owner, repo, isConfigured } = useRepository();
  const createPipelineMutation = useCreatePipeline();
  const createOrUpdateSecret = useCreateOrUpdateSecret();
  // Secrets API 훅 (IntegratedSidePanel 전체에서 사용)
  const { data: secretsData, refetch: refetchSecrets } = useSecrets(
    owner || '',
    repo || '',
  );
  const [workflowName, setWorkflowName] = useState<string>(initialWorkflowName || '');
  const [viewMode, setViewMode] = useState<'yaml' | 'settings'>('settings');
  const [yamlViewMode, setYamlViewMode] = useState<'block' | 'full'>('block');
  const [editableYaml, setEditableYaml] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  // local save status only used for YAML editing button states
  const [, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isYamlEditing, setIsYamlEditing] = useState<boolean>(false);
  const [yamlError, setYamlError] = useState<string>('');
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [missingSecretsState, setMissingSecretsState] = useState<string[]>([]);
  const [newSecretValues, setNewSecretValues] = useState<Record<string, string>>({});

  // Secrets 관리 상태 - 실제 누락된 시크릿 계산
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);

  // 선택된 노드의 시크릿 감지
  useEffect(() => {
    if (
      selectedNode &&
      canNodeUseSecrets(selectedNode.type) &&
      selectedNode.data.config
    ) {
      const requiredSecrets = detectSecretsInConfig(selectedNode.data.config);
      const userSecrets: string[] = [];
      if (secretsData?.data?.groupedSecrets) {
        Object.values(secretsData.data.groupedSecrets).forEach((group: unknown) => {
          if (Array.isArray(group)) {
            group.forEach((secret: unknown) => {
              if (
                secret &&
                typeof secret === 'object' &&
                'name' in secret &&
                typeof secret.name === 'string'
              ) {
                userSecrets.push(secret.name);
              }
            });
          }
        });
      }
      const missing = findMissingSecrets(requiredSecrets, userSecrets);
      setMissingSecrets(missing);
    } else {
      setMissingSecrets([]);
    }
  }, [selectedNode, secretsData]);

  // AreaNodeData를 ServerBlock로 변환하는 함수
  const convertAreaNodeToServerBlock = useCallback((node: AreaNodeData): ServerBlock => {
    return {
      name: node.data.label,
      type:
        node.type === 'workflowTrigger'
          ? 'trigger'
          : (node.type as 'trigger' | 'job' | 'step'),
      description: node.data.description,
      jobName: node.data.jobName,
      config: node.data.config || {},
    };
  }, []);

  // 편집 모드가 활성화되면 YAML을 편집 가능한 상태로 설정
  useEffect(() => {
    if (isYamlEditing && yamlViewMode === 'block' && selectedNode) {
      const serverBlock = convertAreaNodeToServerBlock(selectedNode);
      const yaml = generateBlockYaml(serverBlock);
      setEditableYaml(yaml);
      setYamlError('');
    }
  }, [isYamlEditing, yamlViewMode, selectedNode, convertAreaNodeToServerBlock]);

  // YAML 생성 함수들
  const getBlockYaml = useCallback(() => {
    if (selectedNode) {
      const serverBlock = convertAreaNodeToServerBlock(selectedNode);
      return generateBlockYaml(serverBlock);
    }
    return '# 블록을 선택하여 YAML을 확인하세요';
  }, [selectedNode, convertAreaNodeToServerBlock]);

  const getFullYaml = useCallback(() => {
    if (blocks && blocks.length > 0) {
      return generateFullYaml(blocks);
    }
    return '# 워크플로우를 구성하여 YAML을 확인하세요';
  }, [blocks]);

  // 현재 YAML 내용 가져오기
  const getCurrentYaml = useCallback(() => {
    if (yamlViewMode === 'block') {
      return getBlockYaml();
    } else {
      return getFullYaml();
    }
  }, [yamlViewMode, getBlockYaml, getFullYaml]);

  // YAML 편집 핸들러
  const handleYamlChange = useCallback((value: string) => {
    setEditableYaml(value);
    const result = parseYamlToConfigStrict(value);
    setYamlError(result.success ? '' : result.error || '');
  }, []);

  // YAML 파싱 함수 (엄격)
  const parseYamlToConfig = useCallback((yaml: string): Record<string, unknown> => {
    const result = parseYamlToConfigStrict(yaml);
    if (!result.success) {
      throw new Error(result.error || 'YAML 파싱 실패');
    }
    return result.data || {};
  }, []);

  // 편집된 YAML 저장 핸들러
  const handleSaveYaml = useCallback(async () => {
    if (!editableYaml.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      if (selectedNode && onBlockUpdate) {
        const parsedConfig = parseYamlToConfig(editableYaml);
        const baseBlock = convertAreaNodeToServerBlock(selectedNode);
        const updatedBlock: ServerBlock = { ...baseBlock, config: parsedConfig };
        onBlockUpdate(updatedBlock);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
        setIsYamlEditing(false);
      }
    } catch (e) {
      console.error('YAML 파싱 오류:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [
    editableYaml,
    selectedNode,
    onBlockUpdate,
    parseYamlToConfig,
    convertAreaNodeToServerBlock,
  ]);

  const handleFormatYaml = useCallback(() => {
    setEditableYaml((prev) => formatYaml(prev));
  }, []);

  // YAML 복사
  const copyYaml = useCallback(() => {
    const yaml = getCurrentYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      console.log('YAML이 클립보드에 복사되었습니다.');
    });
  }, [getCurrentYaml]);

  // 서버에 워크플로우 저장 핸들러
  const handleSaveWorkflowToServer = useCallback(async () => {
    if (!isConfigured) {
      toast.error('저장소가 설정되지 않았습니다. 먼저 저장소를 설정해주세요.');
      return;
    }

    if (!hasNodes || blocks.length === 0) {
      toast.error('저장할 워크플로우가 없습니다.');
      return;
    }

    // 워크플로우 이름이 없으면 기본값 사용
    const finalWorkflowName = workflowName.trim() || `workflow-${Date.now()}`;

    try {
      await createPipelineMutation.mutateAsync({
        owner: owner!,
        repo: repo!,
        workflowName: finalWorkflowName,
        inputJson: blocks as unknown as Record<string, unknown>[],
        description: 'PipeMate로 생성된 워크플로우',
      });

      toast.success('워크플로우가 성공적으로 저장되었습니다!');
      setWorkflowName(''); // 저장 후 입력 필드 초기화
    } catch (e) {
      console.error('워크플로우 저장 실패:', e);
      toast.error('워크플로우 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }, [owner, repo, isConfigured, hasNodes, blocks, workflowName, createPipelineMutation]);

  useEffect(() => {
    // blocks의 trigger 블록에서 이름 자동완성: x_name 혹은 name 필드를 사용할 수 있다면 확장 가능
    // 현재는 편집 페이지에서 전달된 initialWorkflowName 우선
    if (initialWorkflowName && !workflowName) {
      setWorkflowName(initialWorkflowName);
    }
    if (onWorkflowNameChange) {
      onWorkflowNameChange(workflowName);
    }
  }, [initialWorkflowName, workflowName, onWorkflowNameChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[450px] xl:w-[500px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-xl z-50">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {selectedNode ? `${selectedNode.data.label} - 노드 패널` : '워크플로우 패널'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X size={16} />
        </Button>
      </div>

      {/* 뷰 모드 탭: 설정 / YAML */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setViewMode('yaml')}
          className={`flex-1 px-3 py-3 text-xs font-medium transition-all duration-200 ${
            viewMode === 'yaml'
              ? 'bg-white text-blue-700 border-b-2 border-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Code size={14} className="mr-1" />
          YAML
        </button>

        <button
          onClick={() => setViewMode('settings')}
          className={`flex-1 px-3 py-3 text-xs font-medium transition-all duration-200 ${
            viewMode === 'settings'
              ? 'bg-white text-blue-700 border-b-2 border-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Settings size={14} className="mr-1" />
          설정
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-auto">
        {/* control 탭 제거됨: settings에 통합 */}

        {viewMode === 'yaml' && (
          <div className="p-4 space-y-4">
            {/* YAML 뷰 모드 선택 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">YAML 미리보기</span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setYamlViewMode('block')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    yamlViewMode === 'block'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  블록
                </button>
                <button
                  onClick={() => setYamlViewMode('full')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    yamlViewMode === 'full'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  전체
                </button>
              </div>
            </div>

            {/* YAML 내용/편집 */}
            {yamlViewMode === 'block' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isYamlEditing ? 'outline' : 'default'}
                    onClick={() => setIsYamlEditing((v) => !v)}
                  >
                    {isYamlEditing ? '미리보기' : '편집'}
                  </Button>
                  {isYamlEditing && (
                    <>
                      <Button size="sm" variant="secondary" onClick={handleFormatYaml}>
                        포맷
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveYaml}
                        disabled={!!yamlError || isSaving}
                      >
                        {isSaving ? '저장 중...' : '저장'}
                      </Button>
                    </>
                  )}
                </div>
                {yamlError && <div className="text-xs text-red-500">{yamlError}</div>}
                {isYamlEditing ? (
                  <textarea
                    value={editableYaml}
                    onChange={(e) => handleYamlChange(e.target.value)}
                    className="w-full h-64 p-3 border rounded font-mono text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="블록 YAML을 편집하세요"
                  />
                ) : (
                  <div className="bg-slate-900 text-slate-100 font-mono text-[11px] leading-5 p-4 rounded-lg max-h-96 overflow-auto border border-slate-800 shadow-inner">
                    <pre className="whitespace-pre-wrap break-words">
                      {getCurrentYaml()}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 text-slate-100 font-mono text-[11px] leading-5 p-4 rounded-lg max-h-96 overflow-auto border border-slate-800 shadow-inner">
                <pre className="whitespace-pre-wrap break-words">{getCurrentYaml()}</pre>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={copyYaml}
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy size={14} />
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
                className="flex items-center gap-2"
              >
                <Download size={14} />
                다운로드
              </Button>
              <Button
                onClick={() => {
                  const yaml = getCurrentYaml();
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head>
                          <title>YAML 미리보기</title>
                          <style>
                            :root { color-scheme: dark; }
                            body {
                              margin: 0;
                              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                              background: #0f172a; /* slate-900 */
                              color: #f1f5f9; /* slate-100 */
                              padding: 20px;
                            }
                            .container {
                              background: #0f172a; /* slate-900 */
                              border: 1px solid #1e293b; /* slate-800 */
                              border-radius: 8px;
                              box-shadow: inset 0 1px 2px rgba(0,0,0,0.35);
                              padding: 16px;
                              max-height: 80vh;
                              overflow: auto;
                            }
                            pre {
                              margin: 0;
                              white-space: pre-wrap;
                              word-break: break-word;
                              font-size: 11px;
                              line-height: 1.4;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <pre>${yaml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                          </div>
                        </body>
                      </html>
                    `);
                  }
                }}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye size={14} />새 창에서 보기
              </Button>
            </div>
          </div>
        )}

        {/* tree/edit 탭 제거됨: 노드 편집은 settings 탭의 노드 섹션에서 수행 */}

        {/* 설정 탭 */}
        {viewMode === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">설정</span>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">일반</TabsTrigger>
                <TabsTrigger value="node">노드</TabsTrigger>
                <TabsTrigger value="secrets">
                  Secrets
                  {missingSecrets.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {missingSecrets.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">워크플로우 설정</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 저장소 상태 */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 border">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">상태:</span>
                        <span
                          className={`font-medium ${
                            isConfigured ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isConfigured ? '설정됨' : '미설정'}
                        </span>
                      </div>
                      {isConfigured && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">소유자:</span>
                            <span className="font-medium">{owner}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">저장소:</span>
                            <span className="font-medium">{repo}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        워크플로우 이름
                      </label>
                      <Input
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="workflow-name"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => {
                          onSaveWorkflow();
                          toast.success(
                            `임시 저장되었습니다${
                              workflowName ? `: ${workflowName}` : ''
                            }.`,
                          );
                          if (onWorkflowNameChange) onWorkflowNameChange(workflowName);
                        }}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        title="현재 워크스페이스 구성(블록) 상태를 임시 저장합니다."
                      >
                        <Save size={14} />
                        {isSaving ? '임시 저장 중...' : '임시 저장'}
                      </Button>
                      <Button
                        onClick={onClearWorkspace}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        title="워크스페이스의 블록을 모두 초기화합니다."
                      >
                        <Trash2 size={14} />
                        워크스페이스 초기화
                      </Button>
                      {mode === 'create' && (
                        <Button
                          onClick={handleSaveWorkflowToServer}
                          disabled={
                            createPipelineMutation.isPending || !isConfigured || !hasNodes
                          }
                          size="sm"
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                          title="새 워크플로우 파일을 생성하여 서버에 저장합니다."
                        >
                          <Save size={14} />
                          {createPipelineMutation.isPending
                            ? '신규 생성 중...'
                            : '신규 생성'}
                        </Button>
                      )}
                      {mode === 'edit' && (
                        <Button
                          onClick={() => {
                            toast.info('편집 중: 상단 저장 버튼으로 서버에 적용됩니다.');
                          }}
                          variant="outline"
                          size="sm"
                          title="편집 모드에서는 상단 저장 버튼으로 서버에 적용됩니다."
                        >
                          서버 저장 안내
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="node" className="space-y-4">
                {!selectedNode ? (
                  <Card>
                    <CardContent className="p-4 text-sm text-gray-600">
                      편집할 노드를 좌측에서 선택하세요.
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">노드 편집</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <NodeEditor
                        nodeData={selectedNode.data}
                        nodeType={selectedNode.type}
                        onSave={(updatedData) => {
                          if (updateNodeData) {
                            updateNodeData(selectedNode.id, updatedData);
                          }
                          toast.success('노드가 저장되었습니다.');
                        }}
                        onCancel={() => {}}
                      />
                      <div className="mt-3">
                        <Button
                          onClick={() => onNodeDelete(selectedNode.id)}
                          size="sm"
                          variant="destructive"
                          className="w-full flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Trash2 size={16} />
                          노드 삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="secrets" className="space-y-4">
                {selectedNode && canNodeUseSecrets(selectedNode.type) ? (
                  <SecretManagementPanel
                    requiredSecrets={detectSecretsInConfig(selectedNode.data.config)}
                    onSecretsUpdated={async () => {
                      // 시크릿 업데이트 후 새로고침 및 재검증
                      try {
                        await refetchSecrets();
                        // 약간의 지연 후 재검증
                        setTimeout(() => {
                          if (
                            selectedNode &&
                            canNodeUseSecrets(selectedNode.type) &&
                            selectedNode.data.config
                          ) {
                            const requiredSecrets = detectSecretsInConfig(
                              selectedNode.data.config,
                            );
                            const userSecrets: string[] = [];
                            if (secretsData?.data?.groupedSecrets) {
                              Object.values(secretsData.data.groupedSecrets).forEach(
                                (group: unknown) => {
                                  if (Array.isArray(group)) {
                                    group.forEach((secret: unknown) => {
                                      if (
                                        secret &&
                                        typeof secret === 'object' &&
                                        'name' in secret &&
                                        typeof secret.name === 'string'
                                      ) {
                                        userSecrets.push(secret.name);
                                      }
                                    });
                                  }
                                },
                              );
                            }
                            const missing = findMissingSecrets(
                              requiredSecrets,
                              userSecrets,
                            );
                            setMissingSecrets(missing);
                          }
                        }, 500);
                      } catch (error) {
                        console.error('시크릿 업데이트 후 새로고침 실패:', error);
                      }
                    }}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        이 노드 타입에서는 시크릿을 사용할 수 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* 누락된 Secrets 생성 다이얼로그 */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>누락된 Secrets 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {missingSecretsState.length === 0 ? (
              <div className="text-sm text-gray-600">누락된 Secret이 없습니다.</div>
            ) : (
              missingSecretsState.map((name) => (
                <div key={name} className="space-y-1">
                  <div className="text-xs font-medium text-gray-700">{name}</div>
                  <Input
                    type="password"
                    placeholder={`${name} 값 입력`}
                    value={newSecretValues[name] || ''}
                    onChange={(e) =>
                      setNewSecretValues((prev) => ({ ...prev, [name]: e.target.value }))
                    }
                  />
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!owner || !repo) return;
                const entries = Object.entries(newSecretValues).filter(
                  ([, v]) => v && v.trim(),
                );
                for (const [secretName, value] of entries) {
                  try {
                    await createOrUpdateSecret.mutateAsync({
                      owner,
                      repo,
                      secretName,
                      data: { value },
                    });
                  } catch (e) {
                    console.error('Secret 생성 실패:', secretName, e);
                  }
                }
                setSecretDialogOpen(false);
                setMissingSecretsState([]);
                setNewSecretValues({});
                // 시크릿 목록 즉시 새로고침
                refetchSecrets();
                toast.success('누락된 Secrets가 저장되었습니다.');
              }}
              disabled={!isConfigured || missingSecretsState.length === 0}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
