import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui';
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
import {
  AlertCircle,
  Key,
  Trash2,
  ChevronDown,
  ChevronRight,
  Lock,
  Folder,
  AlertTriangle,
  Plus,
  AlertOctagon,
} from 'lucide-react';
import { SecretForm } from './SecretForm';
import { GroupedGithubSecretListResponse } from '@/api/secrets/types';
import { toast } from 'react-toastify';

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
  groupedSecrets?: GroupedGithubSecretListResponse['groupedSecrets'];
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

interface SecretsTabProps {
  data: SecretsData;
  form: FormData;
  handlers: SecretsHandlers;
}

export function SecretsTab({ data, form, handlers }: SecretsTabProps) {
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

  // 삭제 확인 다이얼로그 열기
  const handleDeleteClick = (secretName: string) => {
    setDeleteDialog({ isOpen: true, secretName });
  };

  // 삭제 확인
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

  // 삭제 취소
  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, secretName: null });
  };

  // 날짜 포맷팅 함수
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
              <div className="space-y-2 max-h-[320px] overflow-auto">
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
                          {secrets.length}개
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
                          {secrets.map((secret) => (
                            <div
                              key={secret.name}
                              className="flex items-center justify-between px-1.5 py-1 bg-white border border-gray-100 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Key className="w-3 h-3 text-blue-600" />
                                <span className="text-sm font-medium">{secret.name}</span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(
                                    (secret as any).created_at ||
                                      (secret as any).createdAt,
                                  )}
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

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={handleCancelDelete}>
        <AlertDialogContent className="border-red-300 bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              시크릿 삭제
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-700">
              <div>
                <p className="font-medium mb-2">
                  시크릿 &quot;{deleteDialog.secretName}&quot;을 삭제하시겠습니까?
                </p>
                <p className="text-sm text-red-600">
                  이 작업은 되돌릴 수 없으며, 관련된 워크플로우에 영향을 줄 수 있습니다.
                </p>
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
}
