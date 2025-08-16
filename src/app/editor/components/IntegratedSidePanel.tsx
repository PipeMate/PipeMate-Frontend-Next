'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AreaNodeData } from './area-editor/types';
import { ServerBlock } from '../types';
import { WorkflowNodeData } from '../types';
import { NodeType } from './area-editor/types';
import { generateBlockYaml, generateFullYaml } from '../utils/yamlGenerator';
import { useSecrets, useCreateOrUpdateSecret, useDeleteSecret } from '@/api';
import { useRepository } from '@/contexts/RepositoryContext';
import { toast } from 'react-toastify';
import { GithubSettingsDialog } from '@/components/features/GithubSettingsDialog';

import {
  Save,
  Eye,
  Trash2,
  Copy,
  Download,
  X,
  Plus,
  Minus,
  Code,
  Lock,
  Edit,
  Blocks,
  FileText,
  Shield,
  Key,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Folder,
  ChevronDown,
  ChevronRight,
  Settings,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
import { LoadingSpinner } from '@/components/ui';

import {
  detectSecretsInConfig,
  canNodeUseSecrets,
  findMissingSecrets,
} from '../utils/secretsDetector';
import { DragDropSidebar } from './DragDropSidebar';

//* ========================================
//* Props 타입 정의
//* ========================================

interface IntegratedSidePanelProps {
  selectedNode: AreaNodeData | null;
  blocks: ServerBlock[];
  isOpen: boolean;
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
//* 타입 정의
//* ========================================

interface ConfigField {
  key: string;
  value: string | object | string[];
  type: 'string' | 'object' | 'array';
  isExpanded?: boolean;
  children?: ConfigField[];
}

interface SecretFormData {
  name: string;
  value: string;
  description?: string;
}

interface SecretsData {
  availableSecrets: string[];
  missingSecrets: string[];
  loading: boolean;
  error: string | null;
  groupedSecrets?: any;
}

interface FormData {
  showForm: boolean;
  secretsToCreate: SecretFormData[];
  showValues: Record<number, boolean>;
  isCreating: boolean;
}

interface SecretsHandlers {
  onDeleteSecret: (secretName: string) => void;
  onCreateMissingSecrets: (secretNames: string[]) => void;
  onAddSecretForm: () => void;
  onRemoveSecretForm: (index: number) => void;
  onUpdateSecretForm: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onCloseSecretForm: () => void;
  onCreateSecrets: () => void;
}

//* ========================================
//* 시크릿 폼 컴포넌트
//* ========================================

interface SecretFormProps {
  secrets: SecretFormData[];
  showValues: Record<number, boolean>;
  onAddSecret: () => void;
  onRemoveSecret: (index: number) => void;
  onUpdateSecret: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onClose: () => void;
  onCreateSecrets: () => void;
}

const SecretForm: React.FC<SecretFormProps> = ({
  secrets,
  showValues,
  onAddSecret,
  onRemoveSecret,
  onUpdateSecret,
  onToggleValueVisibility,
  onClose,
  onCreateSecrets,
}) => {
  const extractGroup = (secretName: string): string => {
    if (!secretName) return 'UNKNOWN';
    const parts = secretName.split('_');
    return parts.length > 1 ? parts[0] : 'UNKNOWN';
  };

  const groupedSecrets = useMemo(() => {
    const groups: { [key: string]: { secret: SecretFormData; index: number }[] } = {};

    secrets.forEach((secret, index) => {
      const group = extractGroup(secret.name);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push({ secret, index });
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [secrets]);

  const hasValidSecrets =
    secrets.length > 0 && secrets.every((secret) => secret.name && secret.value);

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">시크릿 생성</h3>
            <p className="text-sm text-gray-500">새로운 시크릿을 추가하세요</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pt-4 max-h-[320px]">
        {groupedSecrets.map(([groupName, groupSecrets]) => (
          <div key={groupName} className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-700">{groupName} 그룹</h4>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {groupSecrets.length}개
              </Badge>
            </div>

            {groupSecrets.map(({ secret, index }) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      시크릿 #{index + 1}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      {groupName}
                    </Badge>
                  </div>
                  {secrets.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveSecret(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      ×
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block font-medium">
                    이름 (예: AWS_ACCESS_KEY, DOCKER_PASSWORD)
                  </label>
                  <Input
                    value={secret.name}
                    onChange={(e) => {
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, '');
                      onUpdateSecret(index, 'name', value);
                    }}
                    placeholder="AWS_ACCESS_KEY"
                    className="font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block font-medium">
                    값
                  </label>
                  <div className="relative">
                    <Input
                      type={showValues[index] ? 'text' : 'password'}
                      value={secret.value}
                      onChange={(e) => onUpdateSecret(index, 'value', e.target.value)}
                      placeholder="시크릿 값을 입력하세요..."
                      className="pr-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => onToggleValueVisibility(index)}
                      >
                        {showValues[index] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {secret.name && secret.value && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    준비 완료
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-shrink-0 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onAddSecret}
          className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          시크릿 추가
        </Button>
        <Button
          type="button"
          onClick={onCreateSecrets}
          disabled={!hasValidSecrets}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-colors duration-200"
        >
          <Save className="h-4 w-4 mr-2" />
          저장
        </Button>
      </div>
    </div>
  );
};

//* ========================================
//* 노드 뷰어 컴포넌트
//* ========================================

interface NodeViewerProps {
  node: AreaNodeData;
  onEdit: (node: AreaNodeData) => void;
  onDelete: (nodeId: string) => void;
}

const NodeViewer: React.FC<NodeViewerProps> = ({ node, onEdit, onDelete }) => {
  return (
    <div className="p-4 space-y-4">
      {/* 노드 정보 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">{node.data.label}</h4>
          <Badge variant="outline" className="text-xs">
            {node.type === 'workflowTrigger' ? 'Trigger' : node.type}
          </Badge>
        </div>

        {node.data.description && (
          <p className="text-sm text-gray-600">{node.data.description}</p>
        )}

        {node.data.jobName && (
          <div className="text-sm">
            <span className="text-gray-500">Job Name:</span>
            <span className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded text-xs">
              {node.data.jobName}
            </span>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-2">
        <Button onClick={() => onEdit(node)} size="sm" className="flex-1">
          <Edit size={16} className="mr-2" />
          편집
        </Button>
        <Button onClick={() => onDelete(node.id)} size="sm" variant="destructive">
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

//* ========================================
//* 시크릿 탭 컴포넌트
//* ========================================

interface SecretsTabProps {
  data: SecretsData;
  form: FormData;
  handlers: SecretsHandlers;
}

const SecretsTab: React.FC<SecretsTabProps> = ({ data, form, handlers }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    secretName: string | null;
  }>({ isOpen: false, secretName: null });

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDeleteClick = (secretName: string) => {
    setDeleteDialog({ isOpen: true, secretName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.secretName) return;

    try {
      await handlers.onDeleteSecret(deleteDialog.secretName);
      toast.success(`시크릿 "${deleteDialog.secretName}"이 삭제되었습니다.`);
    } catch (error) {
      toast.error(`시크릿 삭제에 실패했습니다: ${error}`);
    } finally {
      setDeleteDialog({ isOpen: false, secretName: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, secretName: null });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '날짜 없음';
    }
  };

  if (form.showForm) {
    return (
      <div className="h-full flex flex-col">
        <SecretForm
          secrets={form.secretsToCreate}
          showValues={form.showValues}
          onAddSecret={handlers.onAddSecretForm}
          onRemoveSecret={handlers.onRemoveSecretForm}
          onUpdateSecret={handlers.onUpdateSecretForm}
          onToggleValueVisibility={handlers.onToggleValueVisibility}
          onClose={handlers.onCloseSecretForm}
          onCreateSecrets={handlers.onCreateSecrets}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-4 pb-4">
        {data.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                시크릿을 불러오는 중 오류가 발생했습니다
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">GitHub 시크릿</h3>
              <p className="text-sm text-gray-500">저장소의 시크릿을 관리하세요</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  기존 시크릿 ({data.availableSecrets.length})
                </h3>
              </div>
            </div>

            {data.loading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner message="로딩 중..." />
              </div>
            ) : data.availableSecrets.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                생성된 시크릿이 없습니다.
              </div>
            ) : data.groupedSecrets ? (
              <div className="space-y-2 max-h-[260px] overflow-auto">
                {Object.entries(data.groupedSecrets).map(([groupName, secrets]) => (
                  <div
                    key={groupName}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {groupName}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {(secrets as any[]).length}개
                        </Badge>
                      </div>
                      {expandedGroups.has(groupName) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {expandedGroups.has(groupName) && (
                      <div className="p-2">
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {(secrets as any[]).map((secret: any) => (
                            <div
                              key={secret.name}
                              className="flex items-center justify-between px-1.5 py-1 bg-white border border-gray-100 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Key className="w-3 h-3 text-blue-600" />
                                <span className="text-sm font-medium">{secret.name}</span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(secret.created_at || secret.createdAt)}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(secret.name)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {data.availableSecrets.map((secretName) => (
                  <div
                    key={secretName}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{secretName}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(secretName)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.missingSecrets.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    누락된 시크릿 ({data.missingSecrets.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {data.missingSecrets.map((secretName) => (
                  <div
                    key={secretName}
                    className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">{secretName}</span>
                      <Badge variant="destructive" className="text-xs">
                        누락됨
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-shrink-0 pt-4">
        <Button
          onClick={() => handlers.onCreateMissingSecrets([])}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />새 시크릿 추가
        </Button>
        {data.missingSecrets.length > 0 && (
          <Button
            onClick={() => handlers.onCreateMissingSecrets(data.missingSecrets)}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 transition-colors duration-200"
          >
            <AlertOctagon className="h-4 w-4 mr-2" />
            누락된 시크릿 생성
          </Button>
        )}
      </div>

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={handleCancelDelete}>
        <AlertDialogContent className="border-red-300 bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              시크릿 삭제
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-700">
              <div className="space-y-2">
                <div className="font-medium">
                  시크릿 &quot;{deleteDialog.secretName}&quot;을 삭제하시겠습니까?
                </div>
                <div className="text-sm text-red-600">
                  이 작업은 되돌릴 수 없으며, 관련된 워크플로우에 영향을 줄 수 있습니다.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  onDelete: () => void;
  onMissingSecrets?: (missing: string[]) => void;
}

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
  const [editedData, setEditedData] = useState<WorkflowNodeData>(nodeData);
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  const [configText, setConfigText] = useState<string>('');
  const [configError, setConfigError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('fields');
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);
  const [showSecretForm, setShowSecretForm] = useState(false);
  const [secretsToCreate, setSecretsToCreate] = useState<SecretFormData[]>([]);
  const [isCreatingSecrets, setIsCreatingSecrets] = useState(false);

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
          children = parseConfigFields(value as Record<string, unknown>);
        }

        fields.push({
          key,
          value: value as string | object | string[],
          type,
          isExpanded: true,
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
              const newFields = [...configFields];
              if (parentIndex !== undefined) {
                newFields[parentIndex].children![index].key = e.target.value;
              } else {
                newFields[index].key = e.target.value;
              }
              setConfigFields(newFields);
              updateConfigFromFields(newFields);
            }}
            className="flex-1 text-sm"
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
              onChange={(e) => handleFieldChange(index, e.target.value, parentIndex)}
              className="text-sm"
              placeholder="값 입력"
            />
            {/* 시크릿 선택 드롭다운 */}
            {secretsData?.data?.groupedSecrets && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleFieldChange(index, `${{ secrets.${e.target.value} }}`, parentIndex);
                    }
                  }}
                  className="w-full text-xs border rounded px-2 py-1 bg-gray-50"
                  defaultValue=""
                >
                  <option value="">시크릿 선택...</option>
                  {Object.entries(secretsData.data.groupedSecrets).map(([groupName, groupSecrets]) => (
                    <optgroup key={groupName} label={`${groupName} 그룹`}>
                      {Array.isArray(groupSecrets) && groupSecrets.map((secret: any) => (
                        <option key={secret.name} value={secret.name}>
                          {secret.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
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
                  onChange={(e) =>
                    setEditedData((prev) => ({ ...prev, jobName: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            )}

            {nodeType === 'step' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">도메인</label>
                  <Input
                    value={editedData.domain || ''}
                    onChange={(e) =>
                      setEditedData((prev) => ({ ...prev, domain: e.target.value }))
                    }
                    className="mt-1"
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
                    className="mt-1"
                    placeholder="task1, task2, task3"
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

//* ========================================
//* 통합 사이드 패널 컴포넌트
//* ========================================

export const IntegratedSidePanel: React.FC<IntegratedSidePanelProps> = ({
  selectedNode,
  blocks,
  isOpen,
  onSaveWorkflow,
  onClearWorkspace,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onBlockUpdate,
  hasNodes,
  updateNodeData,
  mode = 'create',
  initialWorkflowName,
  onWorkflowNameChange,
}) => {
  const { owner, repo, isConfigured } = useRepository();

  // Secrets API 훅
  const { data: secretsData, refetch: refetchSecrets } = useSecrets(
    owner || '',
    repo || '',
  );
  const createOrUpdateSecret = useCreateOrUpdateSecret();
  const deleteSecret = useDeleteSecret();

  // 상태 관리
  const [workflowName, setWorkflowName] = useState(initialWorkflowName || '');
  const [activeTab, setActiveTab] = useState<'library' | 'editor' | 'yaml'>('library');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNode, setEditingNode] = useState<AreaNodeData | null>(null);
  const [yamlViewMode, setYamlViewMode] = useState<'block' | 'full'>('block');

  // 시크릿 관련 상태
  const [showSecretForm, setShowSecretForm] = useState(false);
  const [secretsToCreate, setSecretsToCreate] = useState<SecretFormData[]>([]);
  const [isCreatingSecrets, setIsCreatingSecrets] = useState(false);

  // 노드 선택 시 편집 탭으로 자동 전환 및 편집 모드 시작
  useEffect(() => {
    if (selectedNode) {
      setActiveTab('editor');
      setEditingNode(selectedNode);
      setIsEditing(true);
    }
  }, [selectedNode]);

  // 워크플로우 이름 변경 핸들러
  const handleWorkflowNameChange = (name: string) => {
    setWorkflowName(name);
    onWorkflowNameChange?.(name);
  };

  // 노드 편집 시작
  const handleEditNode = (node: AreaNodeData) => {
    setEditingNode(node);
    setIsEditing(true);
    setActiveTab('editor');
  };

  // 노드 편집 완료
  const handleSaveNode = (updatedData: WorkflowNodeData) => {
    // 시크릿 검사
    if (canNodeUseSecrets(editingNode?.type || 'step') && updatedData.config) {
      const requiredSecrets = detectSecretsInConfig(updatedData.config);
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

      if (missing.length > 0) {
        // 누락된 시크릿이 있으면 생성 유도
        const shouldCreate = window.confirm(
          `${
            missing.length
          }개의 Secret이 누락되었습니다.\n\n누락된 Secrets:\n${missing.join(
            ', ',
          )}\n\n지금 생성하시겠습니까?`,
        );

        if (shouldCreate) {
          const newSecrets = missing.map((name) => ({
            name,
            value: '',
          }));
          setSecretsToCreate(newSecrets);
          setShowSecretForm(true);
          return; // 시크릿 생성 후 저장
        }
      }
    }

    // 시크릿이 없거나 사용자가 생성하지 않기로 선택한 경우 저장 진행
    if (editingNode && updateNodeData) {
      updateNodeData(editingNode.id, updatedData);
      onNodeEdit({
        ...editingNode,
        data: updatedData,
      });
      toast.success('노드가 저장되었습니다.');
    }
    setIsEditing(false);
    setEditingNode(null);
  };

  // 노드 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNode(null);
  };

  // 그룹 추출 함수 - 시크릿 이름에서 그룹명을 추출
  const extractGroup = (secretName: string): string => {
    if (!secretName) return 'UNKNOWN';
    const parts = secretName.split('_');
    return parts.length > 1 ? parts[0] : 'UNKNOWN';
  };

  // 시크릿 관련 핸들러들
  const handleCreateMissingSecrets = (secretNames: string[]) => {
    if (secretNames.length > 0) {
      const newSecrets = secretNames.map((name) => ({
        name,
        value: '',
      }));
      setSecretsToCreate(newSecrets);
      setShowSecretForm(true);
    } else {
      setSecretsToCreate([{ name: '', value: '' }]);
      setShowSecretForm(true);
    }
  };

  const handleAddSecretForm = () => {
    setSecretsToCreate([...secretsToCreate, { name: '', value: '' }]);
  };

  const handleRemoveSecretForm = (index: number) => {
    const newSecrets = secretsToCreate.filter((_, i) => i !== index);
    setSecretsToCreate(newSecrets);
  };

  const handleUpdateSecretForm = (
    index: number,
    field: keyof SecretFormData,
    value: string,
  ) => {
    const newSecrets = [...secretsToCreate];
    newSecrets[index] = { ...newSecrets[index], [field]: value };
    setSecretsToCreate(newSecrets);
  };

  const handleCloseSecretForm = () => {
    setShowSecretForm(false);
    setSecretsToCreate([]);

    // 시크릿 생성 취소 시에도 노드 저장 진행
    if (editingNode && updateNodeData) {
      const updatedData = editingNode.data;
      updateNodeData(editingNode.id, updatedData);
      onNodeEdit({
        ...editingNode,
        data: updatedData,
      });
      toast.success('노드가 저장되었습니다.');
      setIsEditing(false);
      setEditingNode(null);
    }
  };

  const handleCreateSecrets = async () => {
    const validSecrets = secretsToCreate.filter((s) => s.name.trim() && s.value.trim());

    if (validSecrets.length === 0) {
      return;
    }

    setIsCreatingSecrets(true);

    try {
      await Promise.all(
        validSecrets.map((secret) =>
          createOrUpdateSecret.mutateAsync({
            owner: owner || '',
            repo: repo || '',
            secretName: secret.name.trim(),
            data: { value: secret.value.trim() },
          }),
        ),
      );

      refetchSecrets();
      toast.success(`${validSecrets.length}개의 Secret이 생성되었습니다.`);

      // 시크릿 생성 후 자동으로 노드 저장 진행
      if (editingNode && updateNodeData) {
        const updatedData = editingNode.data;
        updateNodeData(editingNode.id, updatedData);
        onNodeEdit({
          ...editingNode,
          data: updatedData,
        });
        toast.success('노드가 저장되었습니다.');
        setIsEditing(false);
        setEditingNode(null);
      }

      // 다이얼로그 닫기
      handleCloseSecretForm();
    } catch (error) {
      toast.error(`Secret 생성 실패: ${error}`);
    } finally {
      setIsCreatingSecrets(false);
    }
  };

  // YAML 생성 함수들
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

  // 현재 YAML 내용 가져오기
  const getCurrentYaml = useCallback(() => {
    if (yamlViewMode === 'block') {
      return getBlockYaml();
    } else {
      return getFullYaml();
    }
  }, [yamlViewMode, getBlockYaml, getFullYaml]);

  // YAML 복사
  const copyYaml = useCallback(() => {
    const yaml = getCurrentYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      toast.success('YAML이 클립보드에 복사되었습니다.');
    });
  }, [getCurrentYaml]);

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 flex-shrink-0 p-2">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as any);
            // 편집 탭 클릭 시 선택된 노드가 있으면 바로 편집 모드로 전환
            if (value === 'editor' && selectedNode && !isEditing) {
              setEditingNode(selectedNode);
              setIsEditing(true);
            }
          }}
          defaultValue="library"
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Blocks className="h-4 w-4" />
              <span>라이브러리</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>편집</span>
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>YAML</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          defaultValue="library"
          className="w-full h-full flex flex-col"
        >
          {/* 블록 라이브러리 탭 */}
          <TabsContent value="library" className="h-full mt-0 flex-1 min-h-0">
            <div className="h-full overflow-y-auto min-h-0">
              <DragDropSidebar nodePanelOpen={false} onRequestCloseNodePanel={() => {}} />
            </div>
          </TabsContent>

          {/* 편집 탭 */}
          <TabsContent value="editor" className="h-full mt-0 flex-1 min-h-0">
            <div className="h-full overflow-y-auto min-h-0">
              {selectedNode ? (
                <NodeEditor
                  nodeData={selectedNode.data}
                  nodeType={selectedNode.type}
                  onSave={handleSaveNode}
                  onCancel={handleCancelEdit}
                  onDelete={() => onNodeDelete(selectedNode.id)}
                  onMissingSecrets={handleCreateMissingSecrets}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="p-4 text-center">
                    <Edit className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      편집할 노드를 선택하세요
                    </h3>
                    <p className="text-sm text-gray-500">
                      워크플로우에서 편집할 블록을 클릭하면 여기서 편집할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* YAML 탭 */}
          <TabsContent value="yaml" className="h-full mt-0 flex-1 min-h-0">
            <div className="h-full flex flex-col min-h-0">
              {selectedNode ? (
                <>
                  <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">
                          YAML 미리보기
                        </span>
                      </div>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setYamlViewMode('block')}
                          className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                            yamlViewMode === 'block'
                              ? 'bg-white text-orange-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          블록
                        </button>
                        <button
                          onClick={() => setYamlViewMode('full')}
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
                          a.download =
                            yamlViewMode === 'block' ? 'block.yaml' : 'workflow.yaml';
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
                      <pre className="whitespace-pre-wrap break-words">
                        {getCurrentYaml()}
                      </pre>
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
                      워크플로우에서 YAML을 확인할 블록을 클릭하면 여기서 YAML을 볼 수
                      있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 시크릿 생성 다이얼로그 */}
      <Dialog open={showSecretForm} onOpenChange={setShowSecretForm}>
        <DialogContent className="w-[90vw] max-w-2xl h-[85vh] max-h-[700px] p-0 flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between px-6 py-0">
            <DialogTitle className="text-xl font-semibold">
              누락된 Secrets 생성
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 px-6 py-4 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* 노드 정보 */}
              {editingNode && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-orange-100 rounded">
                      <Edit className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-orange-800">
                      편집 중인 노드
                    </span>
                  </div>
                  <div className="text-sm text-orange-700">
                    <strong>노드:</strong> {editingNode.data.label}
                    <br />
                    <strong>타입:</strong> {editingNode.type}
                  </div>
                </div>
              )}

              {/* 시크릿 폼 */}
              <div className="flex-1 space-y-4 overflow-y-auto min-h-0">
                {secretsToCreate.map((secret, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* 시크릿 헤더 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">
                          시크릿 #{index + 1}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700"
                        >
                          {secret.name ? extractGroup(secret.name) : 'UNKNOWN'}
                        </Badge>
                      </div>
                      {secretsToCreate.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSecretForm(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>

                    {/* 시크릿 이름 입력 */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block font-medium">
                        이름 (예: AWS_ACCESS_KEY, DOCKER_PASSWORD)
                      </label>
                      <Input
                        value={secret.name}
                        onChange={(e) => {
                          const value = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_]/g, '');
                          handleUpdateSecretForm(index, 'name', value);
                        }}
                        placeholder="AWS_ACCESS_KEY"
                        className="font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* 시크릿 값 입력 */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block font-medium">
                        값
                      </label>
                      <Input
                        value={secret.value}
                        onChange={(e) =>
                          handleUpdateSecretForm(index, 'value', e.target.value)
                        }
                        placeholder="시크릿 값을 입력하세요..."
                        type="password"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* 준비 완료 표시 */}
                    {secret.name && secret.value && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        준비 완료
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleAddSecretForm}
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  시크릿 추가
                </Button>
                <Button
                  onClick={handleCreateSecrets}
                  disabled={isCreatingSecrets || secretsToCreate.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-colors duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreatingSecrets ? '생성 중...' : '저장'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
