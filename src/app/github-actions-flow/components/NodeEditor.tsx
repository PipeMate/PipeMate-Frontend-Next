'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowNodeData } from '../types';
import { NodeType } from './area-editor/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecrets } from '@/api';
import { useRepository } from '@/contexts/RepositoryContext';
import {
  detectSecretsInConfig,
  canNodeUseSecrets,
  findMissingSecrets,
} from '../utils/secretsDetector';
import { toast } from 'react-toastify';
import { GithubTokenDialog } from '@/components/features/GithubTokenDialog';
import { SecretAutocomplete } from './SecretAutocomplete';
import { SecretCreateDialog } from './SecretCreateDialog';
import { SecretManagementPanel } from './SecretManagementPanel';
import {
  Save,
  X,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
  Lock,
} from 'lucide-react';
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

interface NodeEditorProps {
  nodeData: WorkflowNodeData;
  nodeType: NodeType;
  onSave: (updatedData: WorkflowNodeData) => void;
  onCancel: () => void;
}

interface ConfigField {
  key: string;
  value: string | object | string[];
  type: 'string' | 'object' | 'array';
  isExpanded?: boolean;
  children?: ConfigField[];
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
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
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  // Secrets API 훅 (캐시 최적화 적용)
  const { data: secretsData, refetch: refetchSecrets } = useSecrets(
    owner || '',
    repo || '',
  );

  // 초기 데이터 설정
  useEffect(() => {
    setEditedData(nodeData);
    setConfigText(JSON.stringify(nodeData.config, null, 2));
    setConfigError('');
    const fields = parseConfigFields(nodeData.config);
    setConfigFields(fields);
  }, [nodeData]);

  // Config 변경 시 secrets 감지 (캐시 문제 해결을 위한 개선)
  useEffect(() => {
    if (canNodeUseSecrets(nodeType) && editedData.config) {
      const requiredSecrets = detectSecretsInConfig(editedData.config);
      // API 응답 구조에 맞게 수정 (groupedSecrets 사용)
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

      // console.log('🔍 NodeEditor 시크릿 감지 디버그:', {
      //   requiredSecrets,
      //   userSecrets,
      //   secretsDataStructure: secretsData?.data,
      //   missing: findMissingSecrets(requiredSecrets, userSecrets),
      // });

      const missing = findMissingSecrets(requiredSecrets, userSecrets);
      setMissingSecrets(missing);

      // 누락된 시크릿이 있지만 최근에 생성되었을 가능성이 있으면 재시도
      if (missing.length > 0 && requiredSecrets.length > 0) {
        // 2초 후 한 번 더 확인 (시크릿 생성 직후의 캐시 지연 대응)
        const retryTimer = setTimeout(async () => {
          try {
            await refetchSecrets();
            // console.log('🔄 NodeEditor 시크릿 목록 재확인 완료');
          } catch (error) {
            console.warn('NodeEditor 시크릿 재확인 실패:', error);
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
          description: 'GitHub Actions Job의 기본 설정을 구성합니다.',
        };
      case 'step':
        return {
          name: 'Step 설정',
          description: 'GitHub Actions Step의 실행 명령어와 설정을 구성합니다.',
        };
      default:
        return {
          name: '노드 설정',
          description: '노드의 설정을 구성합니다.',
        };
    }
  };

  // 타입별 편집 가능한 필드 정의
  const getEditableFields = (type: NodeType) => {
    switch (type) {
      case 'workflowTrigger':
        return ['name', 'on'];
      case 'job':
        return ['runs-on', 'needs', 'if'];
      case 'step':
        return ['name', 'run', 'uses', 'with', 'env'];
      default:
        return [];
    }
  };

  // Config 유효성 검사
  const validateConfig = (configStr: string): boolean => {
    try {
      JSON.parse(configStr);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Config 필드 변경 핸들러
  const handleConfigFieldChange = (
    index: number,
    value: string | object | string[],
    parentIndex?: number,
  ) => {
    const updatedFields = [...configFields];
    if (parentIndex !== undefined) {
      // 중첩된 필드인 경우
      const parentField = updatedFields[parentIndex];
      if (parentField.children) {
        parentField.children[index] = {
          ...parentField.children[index],
          value,
        };
      }
    } else {
      // 최상위 필드인 경우
      updatedFields[index] = {
        ...updatedFields[index],
        value,
      };
    }
    setConfigFields(updatedFields);

    // Config 업데이트
    const updatedConfig = updateConfigFromFields(updatedFields);
    setEditedData({
      ...editedData,
      config: updatedConfig,
    });
  };

  // Config 필드에서 Config 객체 생성
  const updateConfigFromFields = (fields: ConfigField[]) => {
    const config: Record<string, any> = {};

    fields.forEach((field) => {
      if (field.type === 'object' && field.children) {
        config[field.key] = updateConfigFromFields(field.children);
      } else {
        config[field.key] = field.value;
      }
    });

    return config;
  };

  // 중첩된 필드 추가
  const handleAddNestedField = (parentIndex: number) => {
    const updatedFields = [...configFields];
    const parentField = updatedFields[parentIndex];
    if (parentField.children) {
      parentField.children.push({
        key: 'new_field',
        value: '',
        type: 'string',
      });
      setConfigFields(updatedFields);
    }
  };

  // 중첩된 필드 제거
  const handleRemoveNestedField = (parentIndex: number, childIndex: number) => {
    const updatedFields = [...configFields];
    const parentField = updatedFields[parentIndex];
    if (parentField.children) {
      parentField.children.splice(childIndex, 1);
      setConfigFields(updatedFields);
    }
  };

  // 필드 확장/축소 토글
  const toggleFieldExpansion = (index: number) => {
    const updatedFields = [...configFields];
    updatedFields[index].isExpanded = !updatedFields[index].isExpanded;
    setConfigFields(updatedFields);
  };

  // Config 필드 추가
  const handleAddConfigField = () => {
    setConfigFields([
      ...configFields,
      {
        key: 'new_field',
        value: '',
        type: 'string',
      },
    ]);
  };

  // Config 필드 제거
  const handleRemoveConfigField = (index: number) => {
    const updatedFields = configFields.filter((_, i) => i !== index);
    setConfigFields(updatedFields);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!validateConfig(configText)) {
      setConfigError('잘못된 JSON 형식입니다.');
      return;
    }
    setSaveConfirmOpen(true);
  };

  // 저장 확인
  const confirmSave = () => {
    try {
      const parsedConfig = JSON.parse(configText);
      const updatedData = {
        ...editedData,
        config: parsedConfig,
      };
      onSave(updatedData);
      toast.success('노드가 성공적으로 저장되었습니다.');
      setSaveConfirmOpen(false);
    } catch (error) {
      setConfigError('Config 저장 중 오류가 발생했습니다.');
      setSaveConfirmOpen(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    onCancel();
  };

  // 필드 값 렌더링 (시크릿 자동완성 포함)
  const renderFieldValue = (field: ConfigField, index: number, parentIndex?: number) => {
    switch (field.type) {
      case 'string':
        // Step 노드이고 시크릿을 사용할 수 있는 경우 SecretAutocomplete 사용
        if (canNodeUseSecrets(nodeType)) {
          return (
            <SecretAutocomplete
              value={field.value as string}
              onChange={(value) => handleConfigFieldChange(index, value, parentIndex)}
              placeholder="값을 입력하거나 ${{ secrets.SECRET_NAME }} 형태로 시크릿 사용"
              onCreateSecret={(secretName) => {
                setMissingSecrets([secretName]);
                setSecretDialogOpen(true);
              }}
            />
          );
        }
        return (
          <Input
            value={field.value as string}
            onChange={(e) => handleConfigFieldChange(index, e.target.value, parentIndex)}
            placeholder="값을 입력하세요"
          />
        );
      case 'array':
        return (
          <Input
            value={Array.isArray(field.value) ? field.value.join(', ') : ''}
            onChange={(e) =>
              handleConfigFieldChange(
                index,
                e.target.value.split(',').map((s) => s.trim()),
                parentIndex,
              )
            }
            placeholder="쉼표로 구분된 값들을 입력하세요"
          />
        );
      case 'object':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleFieldExpansion(index)}
              >
                {field.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              <span className="text-sm text-gray-600">
                {field.isExpanded ? '축소' : '확장'}
              </span>
            </div>
            {field.isExpanded && field.children && (
              <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                {field.children.map((child, childIndex) => (
                  <div key={childIndex} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={child.key}
                        onChange={(e) => {
                          const updatedChildren = [...field.children!];
                          updatedChildren[childIndex] = {
                            ...updatedChildren[childIndex],
                            key: e.target.value,
                          };
                          handleConfigFieldChange(
                            index,
                            { ...field, children: updatedChildren },
                            parentIndex,
                          );
                        }}
                        className="w-32"
                        placeholder="키"
                      />
                      <span className="text-gray-500">:</span>
                      {renderFieldValue(child, childIndex, index)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNestedField(index, childIndex)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNestedField(index)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  필드 추가
                </Button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const labels = getFixedLabels(nodeType);

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{labels.name}</h2>
          <p className="text-sm text-gray-600 mt-1">{labels.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {missingSecrets.length > 0 && (
            <GithubTokenDialog
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Secrets 관리 ({missingSecrets.length})
                </Button>
              }
              missingSecrets={missingSecrets}
            />
          )}
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </div>

      {/* Secrets 경고 */}
      {missingSecrets.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {missingSecrets.length}개의 Secret이 누락되었습니다:
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {missingSecrets.map((secret) => (
              <Badge key={secret} variant="secondary" className="text-xs">
                {secret}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields">필드 편집</TabsTrigger>
          <TabsTrigger value="config">Config 편집</TabsTrigger>
          <TabsTrigger value="secrets" className="relative">
            시크릿 관리
            {missingSecrets.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {missingSecrets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <div className="space-y-4">
            {configFields.map((field, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Input
                          value={field.key}
                          onChange={(e) => {
                            const updatedFields = [...configFields];
                            updatedFields[index] = {
                              ...updatedFields[index],
                              key: e.target.value,
                            };
                            setConfigFields(updatedFields);
                          }}
                          className="w-48"
                          placeholder="필드명"
                        />
                        <Badge variant="outline">{field.type}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveConfigField(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                    {renderFieldValue(field, index)}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddConfigField}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              필드 추가
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Config JSON
              </label>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="JSON 형식으로 config를 입력하세요"
              />
              {configError && <p className="text-red-600 text-sm mt-2">{configError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfigPreview(!showConfigPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </Button>
            </div>
            {showConfigPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Config 미리보기</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto">
                    {JSON.stringify(JSON.parse(configText || '{}'), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 시크릿 관리 탭 */}
        {canNodeUseSecrets(nodeType) && (
          <TabsContent value="secrets" className="space-y-4">
            <SecretManagementPanel
              requiredSecrets={detectSecretsInConfig(editedData.config)}
              onSecretsUpdated={async () => {
                // 시크릿 업데이트 후 새로고침 및 재검증
                try {
                  await refetchSecrets();

                  // 약간의 지연 후 재검증
                  setTimeout(() => {
                    const requiredSecrets = detectSecretsInConfig(editedData.config);
                    const userSecrets: string[] = [];
                    if (secretsData?.data?.groupedSecrets) {
                      Object.values(secretsData.data.groupedSecrets).forEach(
                        (group: any) => {
                          if (Array.isArray(group)) {
                            group.forEach((secret: any) => {
                              if (secret.name) userSecrets.push(secret.name);
                            });
                          }
                        },
                      );
                    }
                    const missing = findMissingSecrets(requiredSecrets, userSecrets);
                    setMissingSecrets(missing);
                    // console.log('🔄 시크릿 업데이트 후 재검증:', { missing });
                  }, 500);
                } catch (error) {
                  console.error('시크릿 업데이트 후 새로고침 실패:', error);
                }
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* 시크릿 생성 다이얼로그 */}
      <SecretCreateDialog
        isOpen={secretDialogOpen}
        onClose={() => {
          setSecretDialogOpen(false);
          setMissingSecrets([]);
        }}
        missingSecrets={missingSecrets}
        onSecretsCreated={async () => {
          // 시크릿 생성 후 즉시 새로고침 및 재검증
          try {
            await refetchSecrets();
            // console.log('🔄 NodeEditor 시크릿 생성 후 새로고침 완료');

            // 새로고침 후 재검증
            if (canNodeUseSecrets(nodeType) && editedData.config) {
              // 약간의 지연 후 재검증 (API 응답 대기)
              setTimeout(() => {
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
                // console.log('🔄 NodeEditor 재검증 완료:', { missing });
              }, 500);
            }
          } catch (error) {
            console.error('NodeEditor 시크릿 새로고침 실패:', error);
          }
        }}
      />

      {/* 저장 확인 다이얼로그 */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-600" />
              노드 저장 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              현재 편집 중인 노드를 저장하시겠습니까?
              <br />
              <span className="text-gray-600 text-sm">
                저장하면 워크플로우에 변경사항이 적용됩니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>저장</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
