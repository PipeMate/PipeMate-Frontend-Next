import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui';
import { AlertCircle, Key, Trash2 } from 'lucide-react';
import { SecretForm } from './SecretForm';

interface SecretFormData {
  name: string;
  value: string;
  description?: string;
}

interface SecretsTabProps {
  availableSecrets: string[];
  missingSecrets: string[];
  secretsLoading: boolean;
  secretsError: string | null;
  showSecretForm: boolean;
  secretsToCreate: SecretFormData[];
  showValues: Record<number, boolean>;
  isCreatingSecrets: boolean;
  onDeleteSecret: (secretName: string) => void;
  onCreateMissingSecrets: (secretNames: string[]) => void;
  onAddSecretForm: () => void;
  onRemoveSecretForm: (index: number) => void;
  onUpdateSecretForm: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onCloseSecretForm: () => void;
  onCreateSecrets: () => void;
}

export function SecretsTab({
  availableSecrets,
  missingSecrets,
  secretsLoading,
  secretsError,
  showSecretForm,
  secretsToCreate,
  showValues,
  isCreatingSecrets,
  onDeleteSecret,
  onCreateMissingSecrets,
  onAddSecretForm,
  onRemoveSecretForm,
  onUpdateSecretForm,
  onToggleValueVisibility,
  onCloseSecretForm,
  onCreateSecrets,
}: SecretsTabProps) {
  if (showSecretForm) {
    return (
      <SecretForm
        secrets={secretsToCreate}
        showValues={showValues}
        onAddSecret={onAddSecretForm}
        onRemoveSecret={onRemoveSecretForm}
        onUpdateSecret={onUpdateSecretForm}
        onToggleValueVisibility={onToggleValueVisibility}
        onClose={onCloseSecretForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {secretsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">
              시크릿을 불러오는 중 오류가 발생했습니다
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            기존 Secrets ({availableSecrets.length})
          </h3>
        </div>

        {secretsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="로딩 중..." />
          </div>
        ) : availableSecrets.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            생성된 Secret이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {availableSecrets.map((secretName) => (
              <div
                key={secretName}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">{secretName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteSecret(secretName)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {missingSecrets.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              누락된 Secrets ({missingSecrets.length})
            </h3>
          </div>

          <div className="space-y-2">
            {missingSecrets.map((secretName) => (
              <div
                key={secretName}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
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

      <div className="flex gap-3">
        <Button onClick={() => onCreateMissingSecrets([])} className="flex-1">
          새 Secret 추가
        </Button>
        {missingSecrets.length > 0 && (
          <Button
            onClick={() => onCreateMissingSecrets(missingSecrets)}
            variant="secondary"
          >
            누락된 Secret 생성
          </Button>
        )}
      </div>
    </div>
  );
}
