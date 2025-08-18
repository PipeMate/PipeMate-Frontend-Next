'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRepository } from '@/contexts/RepositoryContext';
import { useSecrets } from '@/api';
import {
  canNodeUseSecrets,
  detectSecretsInConfig,
  findMissingSecrets,
} from '../../utils/secretsDetector';
import { AlertTriangle, Code, Edit, Lock, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { NodeEditorProps } from './types';
import { getFixedLabels } from './utils';
import type { FieldNode } from './utils/jsonPath';
import {
  buildFieldsFromJson,
  deleteAtPath,
  ensureObjectAt,
  getAtPath,
  renameKey,
  setAtPath,
} from './utils/jsonPath';
import { toast } from 'react-toastify';
import ArrayChipsInput from './components/ArrayChipsInput';
import AutoResizeTextarea from './components/AutoResizeTextarea';

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeData,
  nodeType,
  onSave,
  onCancel,
  onDelete,
  onMissingSecrets: _onMissingSecrets,
}) => {
  const { owner, repo } = useRepository();

  // Secrets API 훅
  const { data: secretsData } = useSecrets(owner || '', repo || '');

  // 클라이언트 사이드 렌더링을 위한 상태
  const [isClient, setIsClient] = useState(false);
  const [editedData, setEditedData] = useState(nodeData);
  const [configFields, setConfigFields] = useState<FieldNode[]>([]);
  const [configText, setConfigText] = useState<string>('');
  const [configError, setConfigError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('fields');
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // nodeData 변경 감지를 위한 메모이제이션
  const nodeDataKey = useMemo(() => {
    return `${JSON.stringify(nodeData)}-${JSON.stringify(nodeData.config)}`;
  }, [nodeData]);

  // 초기 데이터 설정
  useEffect(() => {
    if (nodeData && isClient) {
      // 새로운 노드의 경우 기본 config 구조 제공
      let initialConfig = nodeData.config;
      if (!initialConfig || Object.keys(initialConfig).length === 0) {
        // 노드 타입별 기본 config 구조
        switch (nodeType) {
          case 'workflowTrigger':
            initialConfig = {
              name: 'CI',
              on: {
                workflow_dispatch: {},
                push: {
                  branches: ['main'],
                },
              },
            };
            break;
          case 'job':
            initialConfig = {
              'runs-on': 'ubuntu-latest',
            };
            break;
          case 'step':
            initialConfig = {
              name: 'My Step',
              run: 'echo "Hello World"',
            };
            break;
          default:
            initialConfig = {};
        }

        // 기본 config로 nodeData 업데이트
        const updatedNodeData = {
          ...nodeData,
          config: initialConfig,
        };
        setEditedData(updatedNodeData);
      } else {
        setEditedData(nodeData);
      }

      setConfigText(JSON.stringify(initialConfig, null, 2));
      setConfigError('');
      const fields = buildFieldsFromJson(initialConfig);
      setConfigFields(fields);
    }
  }, [nodeDataKey, isClient, nodeType, nodeData]);

  // 새로운 노드에 기본 필드 추가
  useEffect(() => {
    if (
      isClient &&
      configFields.length === 0 &&
      nodeData &&
      (!nodeData.config || Object.keys(nodeData.config).length === 0)
    ) {
      // 초기 config가 비어있으면 필드 대신 안내 상태를 유지 (버튼으로 추가)
      // 자동 필드 생성은 경로 기반 로직과 충돌 소지가 있어 제거
    }
  }, [isClient, configFields.length, nodeData]);

  // Config 변경 시 secrets 감지
  useEffect(() => {
    if (canNodeUseSecrets(nodeType) && editedData.config) {
      const requiredSecrets = detectSecretsInConfig(editedData.config);
      const userSecrets: string[] = [];
      if (secretsData?.data?.groupedSecrets) {
        Object.values(secretsData.data.groupedSecrets as Record<string, unknown>).forEach(
          (group: unknown) => {
            if (Array.isArray(group)) {
              group.forEach((secret: unknown) => {
                if (
                  secret &&
                  typeof secret === 'object' &&
                  'name' in secret &&
                  typeof (secret as { name: unknown }).name === 'string'
                ) {
                  userSecrets.push((secret as { name: string }).name);
                }
              });
            }
          },
        );
      }
      const missing = findMissingSecrets(requiredSecrets, userSecrets);
      setMissingSecrets(missing);
    }
  }, [editedData.config, nodeType, secretsData]);

  // Config 유효성 검사
  const validateConfig = (configStr: string): boolean => {
    try {
      JSON.parse(configStr);
      return true;
    } catch {
      return false;
    }
  };

  // Config 텍스트 변경 핸들러
  const handleConfigTextChange = (value: string) => {
    setConfigText(value);
    if (validateConfig(value)) {
      setConfigError('');
      try {
        const parsed = JSON.parse(value);
        setEditedData((prev) => ({ ...prev, config: parsed }));
        const fields = buildFieldsFromJson(parsed);
        setConfigFields(fields);
      } catch {
        setConfigError('JSON 파싱 오류');
      }
    } else {
      setConfigError('잘못된 JSON 형식');
    }
  };

  // 경로 기반: config에서 직접 수정 후 필드 재빌드
  const applyConfig = (nextConfig: Record<string, unknown>) => {
    setEditedData((prev) => ({ ...prev, config: nextConfig }));
    setConfigText(JSON.stringify(nextConfig, null, 2));
    setConfigFields(buildFieldsFromJson(nextConfig));
  };

  const handleFieldValueChange = (
    field: FieldNode,
    value: string | object | string[],
  ) => {
    const next = setAtPath(editedData.config || {}, field.path, value);
    applyConfig(next);
  };

  const handleFieldKeyChangeByPath = (field: FieldNode, nextKey: string) => {
    try {
      const parentPath = field.path.slice(0, -1);
      const prevKey = String(field.path[field.path.length - 1]);
      if (nextKey === prevKey) return;
      const next = renameKey(editedData.config || {}, parentPath, prevKey, nextKey);
      applyConfig(next);
    } catch (e) {
      if ((e as Error)?.message === 'duplicate_key') {
        toast.error('동일한 레벨에 중복 키가 존재합니다. 다른 이름을 사용하세요.');
      } else {
        toast.error('키 이름 변경 중 오류가 발생했습니다.');
      }
    }
  };

  const addFieldAtPath = (parentPath: (string | number)[]) => {
    // 부모를 object로 보장 후 고유 키 생성
    let root = ensureObjectAt(editedData.config || {}, parentPath);
    const base = 'new_field';
    let candidate = base;
    let i = 1;
    const parentObj = parentPath.length === 0 ? root : getAtPath(root, parentPath);
    while (parentObj && typeof parentObj === 'object' && candidate in parentObj) {
      candidate = `${base}_${i++}`;
    }
    root = setAtPath(root, [...parentPath, candidate], '');
    applyConfig(root);
  };

  const removeFieldAtPath = (field: FieldNode) => {
    const next = deleteAtPath(editedData.config || {}, field.path);
    applyConfig(next);
  };

  const changeFieldTypeByPath = (
    field: FieldNode,
    newType: 'string' | 'object' | 'array',
  ) => {
    let nextVal: unknown = '';
    if (newType === 'object') nextVal = {};
    else if (newType === 'array') nextVal = [];
    const next = setAtPath(editedData.config || {}, field.path, nextVal);
    applyConfig(next as Record<string, unknown>);
  };

  // 최상위 필드 추가
  const addTopLevelField = () => addFieldAtPath([]);

  // 필드 삭제 (경로)
  const removeField = (field: FieldNode) => removeFieldAtPath(field);

  // 필드 확장/축소 토글
  // index 기반 확장 토글 제거 (경로 기반으로 대체됨)

  // 필드 타입 변경
  const changeFieldType = (field: FieldNode, newType: 'string' | 'object' | 'array') =>
    changeFieldTypeByPath(field, newType);

  // 삭제 확인 핸들러
  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    if (onDelete) {
      onDelete();
    }
  };

  // 저장 핸들러
  const handleSave = () => {
    try {
      // 데이터 유효성 검사
      const errors: string[] = [];

      // 라벨 필수 입력 검사
      if (!editedData.label.trim()) {
        errors.push('라벨을 입력해주세요.');
      } else if (editedData.label.trim().length > 100) {
        errors.push('라벨은 100자를 초과할 수 없습니다.');
      }

      // Job Name 유효성 검사 - 워크플로우에서 사용할 수 있는 안전한 이름
      if (nodeType === 'job') {
        if (!editedData.jobName || !editedData.jobName.trim()) {
          errors.push('Job Name을 입력해주세요.');
        } else {
          const jobName = editedData.jobName.trim();
          if (jobName.length > 50) {
            errors.push('Job Name은 50자를 초과할 수 없습니다.');
          } else if (!/^[a-zA-Z가-힣0-9_-]+$/.test(jobName)) {
            errors.push(
              'Job Name에는 영문, 한글, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.',
            );
          }
        }
      }

      // Step 블록 유효성 검사
      if (nodeType === 'step') {
        // 도메인 필수 입력 및 유효성 검사
        if (!editedData.domain || !editedData.domain.trim()) {
          errors.push('도메인을 입력해주세요.');
        } else {
          const domain = editedData.domain.trim();
          if (domain.length > 30) {
            errors.push('도메인은 30자를 초과할 수 없습니다.');
          } else if (!/^[a-zA-Z가-힣0-9_]+$/.test(domain)) {
            errors.push(
              '도메인에는 영문, 한글, 숫자, 언더스코어(_)만 사용할 수 있습니다.',
            );
          }
        }

        // 태스크 필수 입력 및 유효성 검사
        if (
          !editedData.task ||
          !Array.isArray(editedData.task) ||
          editedData.task.length === 0
        ) {
          errors.push('태스크를 입력해주세요.');
        } else {
          for (const task of editedData.task) {
            if (!task || !task.trim()) {
              errors.push('태스크명을 입력해주세요.');
              break;
            } else {
              const taskName = task.trim();
              if (taskName.length > 30) {
                errors.push('태스크명은 30자를 초과할 수 없습니다.');
                break;
              } else if (!/^[a-zA-Z가-힣0-9_]+$/.test(taskName)) {
                errors.push(
                  '태스크명에는 영문, 한글, 숫자, 언더스코어(_)만 사용할 수 있습니다.',
                );
                break;
              }
            }
          }
        }
      }

      // 브랜치 유효성 검사 (trigger의 경우) - Git 브랜치 네이밍 규칙
      if (nodeType === 'workflowTrigger' && editedData.config) {
        const config = editedData.config as {
          on?: Record<string, { branches?: string[]; tags?: string[] }>;
        };

        // 모든 이벤트 타입에 대해 브랜치 검사
        const events = [
          'push',
          'pull_request',
          'workflow_dispatch',
          'schedule',
          'release',
          'create',
          'delete',
        ];

        for (const event of events) {
          if (config.on?.[event]?.branches) {
            const branches = config.on[event].branches;
            if (Array.isArray(branches)) {
              for (const branch of branches) {
                if (branch && typeof branch === 'string' && branch.trim().length > 0) {
                  const branchName = branch.trim();
                  if (branchName.length > 100) {
                    errors.push(
                      `${event} 이벤트의 브랜치명은 100자를 초과할 수 없습니다.`,
                    );
                    break;
                  } else if (!/^[a-zA-Z가-힣0-9\/\-_.]+$/.test(branchName)) {
                    errors.push(
                      `${event} 이벤트의 브랜치명에는 영문, 한글, 숫자, 슬래시(/), 하이픈(-), 언더스코어(_), 점(.)만 사용할 수 있습니다.`,
                    );
                    break;
                  }
                }
              }
            }
          }
        }

        // 태그 검사 (push, pull_request 이벤트)
        const tagEvents = ['push', 'pull_request'];
        for (const event of tagEvents) {
          if (config.on?.[event]?.tags) {
            const tags = config.on[event].tags;
            if (Array.isArray(tags)) {
              for (const tag of tags) {
                if (tag && typeof tag === 'string' && tag.trim().length > 0) {
                  const tagName = tag.trim();
                  if (tagName.length > 100) {
                    errors.push(`${event} 이벤트의 태그명은 100자를 초과할 수 없습니다.`);
                    break;
                  } else if (!/^[a-zA-Z가-힣0-9\/\-_.]+$/.test(tagName)) {
                    errors.push(
                      `${event} 이벤트의 태그명에는 영문, 한글, 숫자, 슬래시(/), 하이픈(-), 언더스코어(_), 점(.)만 사용할 수 있습니다.`,
                    );
                    break;
                  }
                }
              }
            }
          }
        }
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
        return;
      }

      // 저장 실행
      onSave(editedData);
    } catch (error) {
      console.error('저장 중 오류:', error);
      toast.error('저장에 실패했습니다.');
    }
  };

  // 필드 렌더링 (재귀적)
  const renderField = (field: FieldNode) => {
    const isNested = field.path.length > 1;
    const indentClass = isNested ? 'ml-4' : '';

    // 브랜치 필드인지 확인 (트리거의 경우)
    const parentKey = String(field.path[field.path.length - 2] || '');
    const isBranchField =
      field.key === 'branches' && (parentKey === 'push' || parentKey === 'pull_request');

    return (
      <div key={field.path.join('/')} className={`space-y-3 ${indentClass}`}>
        {/* 필드 헤더 */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex-1 flex items-center gap-2">
            {(field.key?.length || 0) > 30 ? (
              <AutoResizeTextarea
                value={field.key}
                onChange={(v) =>
                  handleFieldKeyChangeByPath(field, v.replace(/\r?\n/g, ' '))
                }
                className="flex-1 text-sm font-mono"
                minRows={1}
                maxRows={4}
                placeholder="필드명"
              />
            ) : (
              <Input
                value={field.key}
                onChange={(e) =>
                  handleFieldKeyChangeByPath(field, e.target.value.replace(/\r?\n/g, ' '))
                }
                className="flex-1 text-sm font-mono"
                placeholder="필드명"
              />
            )}

            <select
              value={field.type}
              onChange={(e) =>
                changeFieldType(field, e.target.value as 'string' | 'object' | 'array')
              }
              className="text-xs border rounded px-2 py-1 bg-white"
            >
              <option value="string">String</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            {(field.type === 'object' || field.type === 'array') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = [...configFields];
                  const idx = next.findIndex(
                    (f) => f.path.join('/') === field.path.join('/'),
                  );
                  if (idx >= 0) next[idx].isExpanded = !next[idx].isExpanded;
                  setConfigFields(next);
                }}
                className="h-8 w-8 p-0"
              >
                {field.isExpanded ? <Minus size={14} /> : <Plus size={14} />}
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeField(field)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* 필드 값 입력 */}
        {field.type === 'string' && (
          <div className="ml-4">
            {String(field.value ?? '').length > 60 ? (
              <AutoResizeTextarea
                value={String(field.value ?? '')}
                onChange={(v) => handleFieldValueChange(field, v)}
                placeholder="값을 입력하거나 ${{ secrets.SECRET_NAME }} 형태로 시크릿 사용"
                minRows={2}
                maxRows={14}
                className="text-sm"
              />
            ) : (
              <Input
                value={String(field.value ?? '')}
                onChange={(e) => handleFieldValueChange(field, e.target.value)}
                className="text-sm font-mono"
                placeholder="값을 입력하거나 ${{ secrets.SECRET_NAME }} 형태로 시크릿 사용"
              />
            )}
          </div>
        )}

        {field.type === 'array' && (
          <div className="ml-4 space-y-2">
            {Array.isArray(field.value) &&
            (field.value as unknown[]).every((v) => typeof v === 'string') ? (
              <ArrayChipsInput
                values={field.value as string[]}
                onChange={(arr) => handleFieldValueChange(field, arr)}
                placeholder={isBranchField ? 'main, develop, feature/*' : '값1, 값2, 값3'}
                helperText={
                  isBranchField
                    ? '브랜치명을 쉼표(,)로 구분하여 입력하세요 (예: main, develop, feature/*)'
                    : '쉼표(,)로 구분하여 여러 값을 입력하세요'
                }
              />
            ) : (
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
                객체 배열 형태는 현재 이 화면에서 직접 편집할 수 없습니다. JSON 탭에서
                수정해주세요.
              </div>
            )}
          </div>
        )}

        {/* 중첩된 객체 필드들 */}
        {field.type === 'object' && field.isExpanded && field.children && (
          <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
            {field.children.map((child) => renderField(child))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => addFieldAtPath(field.path)}
              className="w-full border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              <Plus size={14} className="mr-2" />
              하위 필드 추가
            </Button>
          </div>
        )}
      </div>
    );
  };

  const labels = getFixedLabels(nodeType);

  // 클라이언트 사이드 렌더링이 완료되지 않았으면 로딩 표시
  if (!isClient) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{labels.name}</h3>
          <p className="text-sm text-gray-600">{labels.description}</p>
        </div>
      </div>

      {/* Secrets 경고 */}
      {missingSecrets.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-orange-100 rounded">
              <Lock className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-800">
              {missingSecrets.length}개의 Secret이 누락되었습니다
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {missingSecrets.map((secret) => (
              <Badge
                key={secret}
                variant="secondary"
                className="text-xs bg-orange-100 text-orange-700 border-orange-200"
              >
                {secret}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="fields"
        className="w-full flex-1 min-h-0 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span>필드 편집</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span>Config 편집</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="fields"
          className="h-full flex-1 min-h-0 overflow-y-auto space-y-4"
        >
          {/* 기본 정보 */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">라벨</label>
              <Input
                value={editedData.label}
                onChange={(e) =>
                  setEditedData((prev) => ({ ...prev, label: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">설명</label>
              <Input
                value={editedData.description || ''}
                onChange={(e) =>
                  setEditedData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            {nodeType === 'job' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Job Name</label>
                <Input
                  value={editedData.jobName || ''}
                  onChange={(e) => {
                    setEditedData((prev) => ({ ...prev, jobName: e.target.value }));
                  }}
                  className="mt-1 font-mono"
                  placeholder="JOB_NAME"
                />
              </div>
            )}

            {nodeType === 'step' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">도메인</label>
                  <Input
                    value={editedData.domain || ''}
                    onChange={(e) => {
                      setEditedData((prev) => ({ ...prev, domain: e.target.value }));
                    }}
                    className="mt-1 font-mono"
                    placeholder="DOMAIN_NAME"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Job Name</label>
                  <Input
                    value={editedData.jobName || ''}
                    onChange={(e) => {
                      setEditedData((prev) => ({ ...prev, jobName: e.target.value }));
                    }}
                    className="mt-1 font-mono"
                    placeholder="연결할 JOB_ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">태스크</label>
                  <Input
                    value={
                      Array.isArray(editedData.task) ? editedData.task.join(', ') : ''
                    }
                    onChange={(e) => {
                      const tasks = e.target.value
                        .split(',')
                        .map((task) => task.trim())
                        .filter(Boolean);
                      setEditedData((prev) => ({ ...prev, task: tasks }));
                    }}
                    className="mt-1 font-mono"
                    placeholder="TASK1, TASK2, TASK3"
                  />
                </div>
              </>
            )}
          </div>

          {/* Config 필드들 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">설정</h4>
                <p className="text-xs text-gray-500">
                  워크플로우 실행에 필요한 설정을 구성하세요
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addTopLevelField}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200"
              >
                <Plus size={14} className="mr-2" />
                필드 추가
              </Button>
            </div>

            <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-25">
              {configFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">설정 필드가 없습니다.</p>
                  <p className="text-xs mt-1">
                    필드 추가 버튼을 클릭하여 설정을 구성하세요.
                  </p>
                </div>
              ) : (
                configFields.map((field) => renderField(field))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="config"
          className="h-full flex-1 min-h-0 overflow-y-auto space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Config JSON
            </label>
            <AutoResizeTextarea
              value={configText}
              onChange={handleConfigTextChange}
              className="font-mono text-sm"
              minRows={10}
              maxRows={30}
              placeholder="JSON 형식으로 config를 입력하세요..."
            />
            {configError && <p className="text-red-600 text-sm mt-1">{configError}</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* 액션 버튼들 */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={handleSave}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600 transition-colors duration-200"
        >
          저장
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          취소
        </Button>
        {onDelete && (
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
          >
            삭제
          </Button>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {onDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="border-red-300 bg-red-50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                노드 삭제
              </AlertDialogTitle>
              <AlertDialogDescription className="text-red-700 space-y-2">
                <span className="block font-medium">이 노드를 삭제하시겠습니까?</span>
                <span className="block text-sm text-red-600">
                  이 작업은 되돌릴 수 없으며, 관련된 워크플로우에 영향을 줄 수 있습니다.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800">
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default NodeEditor;
