'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRepository } from '@/contexts/RepositoryContext';
import { useSecrets, useCreateOrUpdateSecret } from '@/api';
import {
  detectSecretsInConfig,
  canNodeUseSecrets,
  findMissingSecrets,
} from '../../utils/secretsDetector';
import { Edit, Code, Plus, Minus, Trash2, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodeEditorProps, ConfigField } from './types';
import { parseConfigFields, getFixedLabels } from './utils';

const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeData,
  nodeType,
  onSave,
  onCancel,
  onDelete,
  onMissingSecrets,
}) => {
  const { owner, repo } = useRepository();

  // Secrets API 훅
  const { data: secretsData, refetch: refetchSecrets } = useSecrets(
    owner || '',
    repo || '',
  );
  const createOrUpdateSecret = useCreateOrUpdateSecret();
  const [editedData, setEditedData] = useState(nodeData);
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  const [configText, setConfigText] = useState<string>('');
  const [configError, setConfigError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('fields');
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);

  // nodeData 변경 감지를 위한 메모이제이션
  const nodeDataKey = useMemo(() => {
    return `${JSON.stringify(nodeData)}-${JSON.stringify(nodeData.config)}`;
  }, [nodeData]);

  // 초기 데이터 설정
  useEffect(() => {
    setEditedData(nodeData);
    setConfigText(JSON.stringify(nodeData.config, null, 2));
    setConfigError('');
    const fields = parseConfigFields(nodeData.config);
    setConfigFields(fields);
  }, [nodeDataKey]);

  // Config 변경 시 secrets 감지
  useEffect(() => {
    if (canNodeUseSecrets(nodeType) && editedData.config) {
      const requiredSecrets = detectSecretsInConfig(editedData.config);
      const userSecrets: string[] = [];
      if (secretsData?.data?.groupedSecrets) {
        Object.values(secretsData.data.groupedSecrets).forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((secret: any) => {
              if (secret.name) userSecrets.push(secret.name);
            });
          }
        });
      }
      const missing = findMissingSecrets(requiredSecrets, userSecrets);
      setMissingSecrets(missing);
    }
  }, [JSON.stringify(editedData.config), nodeType, secretsData]);

  // Config 유효성 검사
  const validateConfig = (configStr: string): boolean => {
    try {
      JSON.parse(configStr);
      return true;
    } catch (error) {
      return false;
    }
  };

  // 필드 값 변경
  const handleFieldChange = (
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
        const objValue: Record<string, unknown> = {};
        field.children.forEach((child) => {
          objValue[child.key] = child.value;
        });
        newConfig[field.key] = objValue;
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

  // 필드 추가
  const addField = (parentIndex?: number) => {
    const newFields = [...configFields];
    const newField: ConfigField = {
      key: 'new_field',
      value: '',
      type: 'string',
      isExpanded: true,
    };

    if (parentIndex !== undefined) {
      const parent = newFields[parentIndex];
      if (parent.children) {
        parent.children.push(newField);
        const parentValue: Record<string, unknown> = {};
        parent.children.forEach((child) => {
          parentValue[child.key] = child.value;
        });
        parent.value = parentValue;
      }
    } else {
      newFields.push(newField);
    }

    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 필드 삭제
  const removeField = (index: number, parentIndex?: number) => {
    const newFields = [...configFields];

    if (parentIndex !== undefined) {
      const parent = newFields[parentIndex];
      if (parent.children) {
        parent.children.splice(index, 1);
        const parentValue: Record<string, unknown> = {};
        parent.children.forEach((child) => {
          parentValue[child.key] = child.value;
        });
        parent.value = parentValue;
      }
    } else {
      newFields.splice(index, 1);
    }

    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 필드 확장/축소 토글
  const toggleFieldExpansion = (index: number, parentIndex?: number) => {
    const newFields = [...configFields];

    if (parentIndex !== undefined) {
      const parent = newFields[parentIndex];
      if (parent.children) {
        parent.children[index].isExpanded = !parent.children[index].isExpanded;
      }
    } else {
      newFields[index].isExpanded = !newFields[index].isExpanded;
    }

    setConfigFields(newFields);
  };

  // 필드 타입 변경
  const changeFieldType = (
    index: number,
    newType: 'string' | 'object' | 'array',
    parentIndex?: number,
  ) => {
    const newFields = [...configFields];

    if (parentIndex !== undefined) {
      const parent = newFields[parentIndex];
      if (parent.children) {
        const field = parent.children[index];
        field.type = newType;
        field.isExpanded = true;

        if (newType === 'object') {
          field.value = {};
          field.children = [];
        } else if (newType === 'array') {
          field.value = [];
        } else {
          field.value = '';
          field.children = undefined;
        }

        const parentValue: Record<string, unknown> = {};
        parent.children.forEach((child) => {
          parentValue[child.key] = child.value;
        });
        parent.value = parentValue;
      }
    } else {
      const field = newFields[index];
      field.type = newType;
      field.isExpanded = true;

      if (newType === 'object') {
        field.value = {};
        field.children = [];
      } else if (newType === 'array') {
        field.value = [];
      } else {
        field.value = '';
        field.children = undefined;
      }
    }

    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 필드 렌더링 (재귀적)
  const renderField = (field: ConfigField, index: number, parentIndex?: number) => {
    const isNested = parentIndex !== undefined;
    const indentClass = isNested ? 'ml-4' : '';

    return (
      <div
        key={`${parentIndex || 'root'}-${index}`}
        className={`space-y-2 ${indentClass}`}
      >
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <Input
            value={field.key}
            onChange={(e) => {
              const value = e.target.value;
              const newFields = [...configFields];
              if (parentIndex !== undefined) {
                newFields[parentIndex].children![index].key = value;
              } else {
                newFields[index].key = value;
              }
              setConfigFields(newFields);
              updateConfigFromFields(newFields);
            }}
            className="flex-1 text-sm font-mono"
            placeholder="필드명"
          />

          <select
            value={field.type}
            onChange={(e) =>
              changeFieldType(
                index,
                e.target.value as 'string' | 'object' | 'array',
                parentIndex,
              )
            }
            className="text-xs border rounded px-2 py-1"
          >
            <option value="string">String</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {(field.type === 'object' || field.type === 'array') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFieldExpansion(index, parentIndex)}
            >
              {field.isExpanded ? <Minus size={14} /> : <Plus size={14} />}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeField(index, parentIndex)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* 필드 값 입력 */}
        {field.type === 'string' && (
          <div className="space-y-2">
            <Input
              value={field.value as string}
              onChange={(e) => {
                const value = e.target.value;
                handleFieldChange(index, value, parentIndex);
              }}
              className="text-sm font-mono"
              placeholder="값을 입력하거나 ${{ secrets.SECRET_NAME }} 형태로 시크릿 사용"
            />
          </div>
        )}

        {field.type === 'array' && (
          <div className="space-y-2">
            <Input
              value={Array.isArray(field.value) ? field.value.join(', ') : ''}
              onChange={(e) => {
                const arrayValue = e.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean);
                handleFieldChange(index, arrayValue, parentIndex);
              }}
              className="text-sm"
              placeholder="값1, 값2, 값3"
            />
          </div>
        )}

        {/* 중첩된 객체/배열 필드들 */}
        {field.type === 'object' && field.isExpanded && field.children && (
          <div className="space-y-2 border-l-2 border-gray-200 pl-4">
            {field.children.map((child, childIndex) =>
              renderField(
                child,
                childIndex,
                parentIndex !== undefined ? parentIndex : index,
              ),
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => addField(parentIndex !== undefined ? parentIndex : index)}
              className="w-full"
            >
              <Plus size={14} className="mr-2" />
              필드 추가
            </Button>
          </div>
        )}
      </div>
    );
  };

  const labels = getFixedLabels(nodeType);

  return (
    <div className="p-4 space-y-4">
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
        className="w-full h-full flex flex-col"
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

        <TabsContent value="fields" className="space-y-4">
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
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                    setEditedData((prev) => ({ ...prev, jobName: value }));
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
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, '');
                      setEditedData((prev) => ({ ...prev, domain: value }));
                    }}
                    className="mt-1 font-mono"
                    placeholder="DOMAIN_NAME"
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
                        .map((task) =>
                          task
                            .trim()
                            .toUpperCase()
                            .replace(/[^A-Z0-9_]/g, ''),
                        )
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
              <h4 className="text-sm font-medium text-gray-700">설정</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addField()}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200"
              >
                <Plus size={14} className="mr-2" />
                필드 추가
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-auto">
              {configFields.map((field, index) => renderField(field, index))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Config JSON
            </label>
            <textarea
              value={configText}
              onChange={(e) => {
                setConfigText(e.target.value);
                if (validateConfig(e.target.value)) {
                  setConfigError('');
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditedData((prev) => ({ ...prev, config: parsed }));
                  } catch (error) {
                    setConfigError('JSON 파싱 오류');
                  }
                } else {
                  setConfigError('잘못된 JSON 형식');
                }
              }}
              className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none"
              placeholder="JSON 형식으로 config를 입력하세요..."
            />
            {configError && <p className="text-red-600 text-sm mt-1">{configError}</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* 액션 버튼들 */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={() => onSave(editedData)}
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
        <Button
          onClick={() => {
            if (
              window.confirm('이 노드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
            ) {
              onDelete();
            }
          }}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
        >
          삭제
        </Button>
      </div>
    </div>
  );
};

export default NodeEditor;
