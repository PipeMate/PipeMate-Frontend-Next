'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AreaNodeData } from './area-editor/types';
import { ServerBlock } from '../types';
import { WorkflowNodeData } from '../types';
import { NodeType } from './area-editor/types';
import { generateBlockYaml, generateFullYaml } from '../utils/yamlGenerator';
import { useCreatePipeline } from '@/api/hooks/usePipeline';
import { useRepository } from '@/contexts/RepositoryContext';
import { toast } from 'react-toastify';
import { GithubTokenDialog } from '@/components/features/GithubTokenDialog';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  Play,
  Settings,
  Save,
  Eye,
  Edit,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecrets } from '@/api/hooks';
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
}

//* ========================================
//* 워크플로우 구조 타입 정의
//* ========================================

interface WorkflowStructure {
  trigger?: ServerBlock;
  jobs: {
    [jobName: string]: {
      job: ServerBlock;
      steps: ServerBlock[];
    };
  };
}

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

const analyzeWorkflowStructure = (blocks: ServerBlock[]): WorkflowStructure => {
  const structure: WorkflowStructure = {
    jobs: {},
  };

  if (!blocks || blocks.length === 0) {
    return structure;
  }

  blocks.forEach((block) => {
    if (!block || !block.type) return;

    if (block.type === 'trigger') {
      structure.trigger = block;
    } else if (block.type === 'job') {
      const jobName = block['job-name'] || 'unknown';
      structure.jobs[jobName] = {
        job: block,
        steps: [],
      };
    } else if (block.type === 'step') {
      const jobName = block['job-name'] || 'unknown';
      if (!structure.jobs[jobName]) {
        structure.jobs[jobName] = {
          job: {
            name: jobName,
            type: 'job',
            'job-name': jobName,
          } as ServerBlock,
          steps: [],
        };
      }
      structure.jobs[jobName].steps.push(block);
    }
  });

  return structure;
};

//* ========================================
//* 트리 뷰 컴포넌트
//* ========================================

interface TreeViewProps {
  structure: WorkflowStructure;
  onBlockSelect?: (block: ServerBlock) => void;
  selectedBlock?: ServerBlock;
}

const TreeView: React.FC<TreeViewProps> = ({
  structure,
  onBlockSelect,
  selectedBlock,
}) => {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const toggleJob = (jobName: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobName)) {
      newExpanded.delete(jobName);
    } else {
      newExpanded.add(jobName);
    }
    setExpandedJobs(newExpanded);
  };

  const isSelected = (block: ServerBlock) => {
    return selectedBlock?.name === block.name && selectedBlock?.type === block.type;
  };

  if (!structure || !structure.jobs) {
    return (
      <div className="text-center text-gray-500 py-4">
        워크플로우 구조를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Trigger */}
      {structure.trigger && (
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected(structure.trigger)
              ? 'bg-blue-100 border border-blue-300'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onBlockSelect?.(structure.trigger!)}
        >
          <Play size={16} className="text-blue-600" />
          <span className="text-sm font-medium">{structure.trigger.name}</span>
          <span className="text-xs text-gray-500">(Trigger)</span>
        </div>
      )}

      {/* Jobs */}
      {Object.entries(structure.jobs).map(([jobName, jobData]) => (
        <div key={jobName} className="border border-gray-200 rounded">
          <div
            className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
              isSelected(jobData.job)
                ? 'bg-green-100 border-b border-green-300'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onBlockSelect?.(jobData.job)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleJob(jobName);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expandedJobs.has(jobName) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            <Folder size={16} className="text-green-600" />
            <span className="text-sm font-medium">{jobData.job.name}</span>
            <span className="text-xs text-gray-500">({jobName})</span>
            <span className="text-xs text-gray-400 ml-auto">
              {jobData.steps.length} steps
            </span>
          </div>

          {/* Steps */}
          {expandedJobs.has(jobName) && (
            <div className="bg-gray-50 border-t border-gray-200">
              {jobData.steps.map((step, index) => (
                <div
                  key={`${jobName}-${index}`}
                  className={`flex items-center gap-2 p-2 ml-4 cursor-pointer transition-colors ${
                    isSelected(step)
                      ? 'bg-orange-100 border border-orange-300'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onBlockSelect?.(step)}
                >
                  <File size={14} className="text-orange-600" />
                  <span className="text-sm">{step.name}</span>
                  <span className="text-xs text-gray-500">(Step {index + 1})</span>
                </div>
              ))}
              {jobData.steps.length === 0 && (
                <div className="flex items-center gap-2 p-2 ml-4 text-gray-400">
                  <File size={14} />
                  <span className="text-sm">No steps</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {Object.keys(structure.jobs).length === 0 && (
        <div className="text-center text-gray-500 py-4">No jobs configured</div>
      )}
    </div>
  );
};

//* ========================================
//* 노드 에디터 컴포넌트
//* ========================================

interface NodeEditorProps {
  nodeData: WorkflowNodeData;
  nodeType: NodeType;
  onSave: (updatedData: WorkflowNodeData) => void;
  onCancel: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeData,
  nodeType,
  onSave,
  onCancel,
}) => {
  const { owner, repo } = useRepository();
  const [editedData, setEditedData] = useState<WorkflowNodeData>(nodeData);
  const [configText, setConfigText] = useState<string>('');
  const [configError, setConfigError] = useState<string>('');
  const [showConfigPreview, setShowConfigPreview] = useState(false);
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  const [activeTab] = useState('fields');
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);

  // Secrets API 훅
  const { data: secretsData } = useSecrets(owner || '', repo || '');

  // 초기 데이터 설정
  useEffect(() => {
    setEditedData(nodeData);
    setConfigText(JSON.stringify(nodeData.config, null, 2));
    setConfigError('');
    const fields = parseConfigFields(nodeData.config);
    setConfigFields(fields);
  }, [nodeData]);

  // Config 변경 시 secrets 감지
  useEffect(() => {
    if (canNodeUseSecrets(nodeType) && editedData.config) {
      const requiredSecrets = detectSecretsInConfig(editedData.config);
      const userSecrets = secretsData?.data?.secrets?.map((s: any) => s.name) || [];
      const missing = findMissingSecrets(requiredSecrets, userSecrets);
      setMissingSecrets(missing);

      // 누락된 secrets가 있으면 토스트 표시
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
  }, [editedData.config, nodeType, secretsData]);

  // config 필드 파싱 (재귀적으로 중첩 객체 처리)
  const parseConfigFields = (
    config: Record<string, unknown>,
    parentKey = '',
  ): ConfigField[] => {
    const fields: ConfigField[] = [];

    Object.entries(config).forEach(([key, value]) => {
      let type: 'string' | 'object' | 'array' = 'string';
      let children: ConfigField[] | undefined;

      if (Array.isArray(value)) {
        type = 'array';
      } else if (value && typeof value === 'object') {
        type = 'object';
        // 중첩된 객체의 경우 재귀적으로 파싱
        children = parseConfigFields(value as Record<string, unknown>, key);
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
  };

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
    } catch (error) {
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
    } catch (error) {
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
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
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
                placeholder="job-name을 입력하세요"
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
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onBlockUpdate,
  hasNodes,
  updateNodeData,
}) => {
  const { owner, repo, isConfigured } = useRepository();
  const createPipelineMutation = useCreatePipeline();
  const [workflowName, setWorkflowName] = useState<string>('');
  const [viewMode, setViewMode] = useState<
    'control' | 'yaml' | 'tree' | 'edit' | 'settings'
  >('control');
  const [yamlViewMode, setYamlViewMode] = useState<'block' | 'full'>('block');
  const [editableYaml, setEditableYaml] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  );

  // Secrets 관리 상태
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);

  // 워크플로우 구조 분석
  const workflowStructure = useMemo(() => {
    try {
      return analyzeWorkflowStructure(blocks || []);
    } catch (error) {
      console.error('워크플로우 구조 분석 오류:', error);
      return { jobs: {} };
    }
  }, [blocks]);

  // AreaNodeData를 ServerBlock로 변환하는 함수
  const convertAreaNodeToServerBlock = useCallback((node: AreaNodeData): ServerBlock => {
    return {
      name: node.data.label,
      type:
        node.type === 'workflowTrigger'
          ? 'trigger'
          : (node.type as 'trigger' | 'job' | 'step'),
      description: node.data.description,
      'job-name': node.data.jobName,
      config: node.data.config || {},
    };
  }, []);

  // Secrets 관리자 열기 핸들러
  const handleOpenSecretsManager = useCallback((secrets: string[]) => {
    setMissingSecrets(secrets);
  }, []);

  // 편집 모드가 활성화되면 YAML을 편집 가능한 상태로 설정
  useEffect(() => {
    if (viewMode === 'edit' && selectedNode) {
      const serverBlock = convertAreaNodeToServerBlock(selectedNode);
      const yaml = generateBlockYaml(serverBlock);
      setEditableYaml(yaml);
    }
  }, [viewMode, selectedNode, convertAreaNodeToServerBlock]);

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
  }, []);

  // YAML 파싱 함수
  const parseYamlToConfig = useCallback((yaml: string): Record<string, unknown> => {
    const lines = yaml.split('\n');
    const config: Record<string, unknown> = {};
    let currentKey = '';
    let currentValue: Record<string, unknown> | unknown[] = {};

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      const match = trimmedLine.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (value) {
          config[key] = value;
        } else {
          currentKey = key;
          currentValue = {};
        }
      } else if (trimmedLine.startsWith('- ')) {
        const item = trimmedLine.substring(2);
        if (!Array.isArray(currentValue)) {
          currentValue = [];
        }
        (currentValue as unknown[]).push(item);
        config[currentKey] = currentValue;
      } else if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map((s) => s.trim());
        if (value) {
          if (!(currentValue as Record<string, unknown>)[key]) {
            (currentValue as Record<string, unknown>)[key] = {};
          }
          (currentValue as Record<string, unknown>)[key] = value;
        }
        config[currentKey] = currentValue;
      }
    });

    return config;
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
      }
    } catch (error) {
      console.error('YAML 파싱 오류:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [editableYaml, selectedNode, onBlockUpdate, parseYamlToConfig]);

  // YAML 복사
  const copyYaml = useCallback(() => {
    const yaml = getCurrentYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      console.log('YAML이 클립보드에 복사되었습니다.');
    });
  }, [getCurrentYaml]);

  // 트리 뷰에서 블록 선택 핸들러
  const handleBlockSelect = useCallback(
    (block: ServerBlock) => {
      if (onBlockUpdate) {
        onBlockUpdate(block);
      }
    },
    [onBlockUpdate],
  );

  // 노드 저장 핸들러 (로컬 편집용)
  const handleNodeSave = useCallback(
    (updatedData: WorkflowNodeData) => {
      if (selectedNode && updateNodeData) {
        // 노드 데이터 직접 업데이트
        updateNodeData(selectedNode.id, updatedData);
      }

      if (selectedNode && onBlockUpdate) {
        // ServerBlock로도 업데이트 (YAML 미리보기용)
        const updatedBlock: ServerBlock = {
          name: updatedData.label,
          type:
            selectedNode.type === 'workflowTrigger'
              ? 'trigger'
              : (selectedNode.type as 'trigger' | 'job' | 'step'),
          description: updatedData.description,
          'job-name': updatedData.jobName,
          config: updatedData.config,
        };
        onBlockUpdate(updatedBlock);
      }
    },
    [selectedNode, updateNodeData, onBlockUpdate],
  );

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
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
      toast.error('워크플로우 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }, [owner, repo, isConfigured, hasNodes, blocks, workflowName, createPipelineMutation]);

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

      {/* 뷰 모드 탭 */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setViewMode('control')}
          className={`flex-1 px-3 py-3 text-xs font-medium transition-all duration-200 ${
            viewMode === 'control'
              ? 'bg-white text-blue-700 border-b-2 border-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Settings size={14} className="mr-1" />
          컨트롤
        </button>
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
          onClick={() => setViewMode('tree')}
          className={`flex-1 px-3 py-3 text-xs font-medium transition-all duration-200 ${
            viewMode === 'tree'
              ? 'bg-white text-blue-700 border-b-2 border-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Folder size={14} className="mr-1" />
          트리
        </button>
        <button
          onClick={() => setViewMode('edit')}
          className={`flex-1 px-3 py-3 text-xs font-medium transition-all duration-200 ${
            viewMode === 'edit'
              ? 'bg-white text-blue-700 border-b-2 border-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Edit size={14} className="mr-1" />
          편집
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
        {viewMode === 'control' && (
          <div className="p-4 space-y-6">
            {/* 저장소 상태 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-blue-600" />
                <div className="text-sm font-medium text-gray-700">저장소 설정</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
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
            </div>

            {/* 워크플로우 전체 액션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-blue-600" />
                <div className="text-sm font-medium text-gray-700">워크플로우 액션</div>
              </div>

              {/* 워크플로우 이름 입력 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  워크플로우 이름
                </label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="워크플로우 이름을 입력하세요"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSaveWorkflowToServer}
                  disabled={
                    createPipelineMutation.isPending || !isConfigured || !hasNodes
                  }
                  size="sm"
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm disabled:opacity-50"
                >
                  <Save size={16} />
                  {createPipelineMutation.isPending ? '저장 중...' : '서버 저장'}
                </Button>
                <Button
                  onClick={onClearWorkspace}
                  size="sm"
                  variant="destructive"
                  className="flex items-center justify-center gap-2 shadow-sm"
                >
                  <Trash2 size={16} />
                  초기화
                </Button>
              </div>
            </div>

            {/* 선택된 노드 삭제 */}
            {selectedNode && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Edit size={16} className="text-red-600" />
                  <div className="text-sm font-medium text-gray-700">
                    선택된 노드: {selectedNode.data.label}
                  </div>
                </div>
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
            )}
          </div>
        )}

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

            {/* YAML 내용 */}
            <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg max-h-96 overflow-auto border border-gray-700">
              <pre className="whitespace-pre-wrap break-words">{getCurrentYaml()}</pre>
            </div>

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
                            body { font-family: monospace; background: #1e1e1e; color: #4ade80; padding: 20px; }
                            pre { white-space: pre-wrap; word-break: break-word; }
                          </style>
                        </head>
                        <body>
                          <pre>${yaml}</pre>
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

        {viewMode === 'tree' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Folder size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">워크플로우 구조</span>
            </div>
            <div className="bg-white text-gray-900 rounded-lg border border-gray-200 h-80 overflow-auto shadow-sm">
              <TreeView
                structure={workflowStructure}
                onBlockSelect={handleBlockSelect}
                selectedBlock={selectedNode as any}
              />
            </div>
          </div>
        )}

        {viewMode === 'edit' && selectedNode && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Edit size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">노드 편집</span>
            </div>
            <NodeEditor
              nodeData={selectedNode.data}
              nodeType={selectedNode.type}
              onSave={(updatedData) => {
                if (updateNodeData) {
                  updateNodeData(selectedNode.id, updatedData);
                }
                setViewMode('control');
              }}
              onCancel={() => setViewMode('control')}
            />
          </div>
        )}

        {/* 설정 탭 */}
        {viewMode === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">설정</span>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">일반</TabsTrigger>
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
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={onSaveWorkflow}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save size={14} />
                        {isSaving ? '저장 중...' : '워크플로우 저장'}
                      </Button>
                      <Button
                        onClick={onClearWorkspace}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        워크스페이스 초기화
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secrets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Secrets 관리
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        GitHub Secrets를 생성하고 관리하세요. 워크플로우에서 사용되는
                        secrets가 누락된 경우 여기서 추가할 수 있습니다.
                      </p>
                      <GithubTokenDialog
                        trigger={
                          <Button className="w-full">
                            <Lock className="w-4 h-4 mr-2" />
                            Secrets 관리자 열기
                          </Button>
                        }
                        missingSecrets={missingSecrets}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* GitHub 설정 관리 (Secrets 포함) */}
      <GithubTokenDialog
        trigger={
          <Button className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Secrets 관리자 열기
          </Button>
        }
        missingSecrets={missingSecrets}
      />
    </div>
  );
};
