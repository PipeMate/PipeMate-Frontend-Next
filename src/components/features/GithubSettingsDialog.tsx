import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ExternalLink, GitBranch, Github, Lock } from 'lucide-react';

// * 커스텀 훅 import
import { useGithubSettings } from '@/hooks/useGithubSettings';
import { useDeleteSecret, useSecrets } from '@/api';
import { useSecretManager } from '@/app/editor/hooks/useSecretManager';

// * 분리된 탭 컴포넌트들
import { TokenTab } from './github-settings/TokenTab';
import { RepositoryTab } from './github-settings/RepositoryTab';
import { SecretsTab } from './github-settings/SecretsTab';

interface GithubSettingsDialogProps {
  trigger?: React.ReactNode;
  onTokenChange?: (token: string | null) => void;
  missingSecrets?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SecretFormData {
  name: string;
  value: string;
  description?: string;
}

export function GithubSettingsDialog({
  trigger,
  onTokenChange,
  missingSecrets = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: GithubSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('token');

  // * 외부에서 제어하는지 내부에서 제어하는지 결정
  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  // * GitHub 설정 커스텀 훅 사용
  const {
    token,
    savedToken,
    tokenError,
    owner,
    repo,
    savedOwner,
    savedRepo,
    repoError,
    hasToken,
    hasRepository,
    setToken,
    setOwner,
    setRepo,
    handleSaveToken,
    handleDeleteToken,
    handleSaveRepository,
    handleDeleteRepository,
  } = useGithubSettings();

  // * 시크릿 관련 상태
  const [showSecretForm, setShowSecretForm] = useState(false);
  const [secretsToCreate, setSecretsToCreate] = useState<SecretFormData[]>([]);
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});
  const [isCreatingSecrets, setIsCreatingSecrets] = useState(false);

  // * 새로운 시크릿 관리 훅 사용
  const {
    secrets: availableSecrets,
    isLoading: secretsLoading,
    error: secretsError,
    createSecret,
    refreshSecrets,
  } = useSecretManager();

  // * 레거시 API 훅 (삭제용으로만 사용)
  const deleteSecretMutation = useDeleteSecret();

  // * 기존 API 훅 (호환성 유지)
  const { data: secretsData, isLoading } = useSecrets(owner || '', repo || '');

  // * 조건부 탭 활성화를 위한 상태 확인
  const canAccessSecrets = hasToken && hasRepository;

  // * 토큰 변경 시 콜백 호출
  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(savedToken);
    }
  }, [savedToken, onTokenChange]);

  // * 시크릿 삭제 핸들러
  const handleDeleteSecret = async (secretName: string) => {
    try {
      await deleteSecretMutation.mutateAsync({
        owner: savedOwner || '',
        repo: savedRepo || '',
        secretName,
      });
      refreshSecrets();
    } catch (error) {
      console.error('시크릿 삭제 실패:', error);
    }
  };

  // * 누락된 시크릿 생성 핸들러
  const handleCreateMissingSecrets = (secretNames: string[]) => {
    if (secretNames.length > 0) {
      // * 누락된 시크릿 이름으로 폼 생성
      const newSecrets = secretNames.map((name) => ({
        name,
        value: '',
      }));
      setSecretsToCreate(newSecrets);
      setShowValues({});
      setShowSecretForm(true);
    } else {
      // * 빈 시크릿 폼 생성
      setSecretsToCreate([{ name: '', value: '' }]);
      setShowValues({});
      setShowSecretForm(true);
    }
  };

  // * 시크릿 폼 관련 핸들러들
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

  const handleToggleValueVisibility = (index: number) => {
    setShowValues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCloseSecretForm = () => {
    setShowSecretForm(false);
    setSecretsToCreate([]);
    setShowValues({});
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
          createSecret(secret.name.trim(), secret.value.trim()),
        ),
      );

      refreshSecrets();
      handleCloseSecretForm();
    } catch (error) {
      console.error('시크릿 생성 실패:', error);
    } finally {
      setIsCreatingSecrets(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 justify-center font-semibold text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 border-3 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 rounded-xl"
            >
              <Github className="text-[#24292f] size-4 sm:size-5" />
              <span>설정 관리</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="w-[90vw] max-w-4xl h-[80vh] max-h-[600px] p-0 flex flex-col py-4">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-0">
          <DialogTitle className="text-xl font-semibold">GitHub 설정</DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-6">
          <Tabs
            defaultValue="token"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="token" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>토큰</span>
              </TabsTrigger>
              <TabsTrigger value="repository" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span>레포지토리</span>
              </TabsTrigger>
              <TabsTrigger value="secrets" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>시크릿</span>
                {missingSecrets.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {missingSecrets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="token" className="h-full mt-0">
                <TokenTab
                  data={{
                    token,
                    savedToken,
                    error: tokenError,
                  }}
                  handlers={{
                    onTokenChange: setToken,
                    onSaveToken: handleSaveToken,
                    onDeleteToken: handleDeleteToken,
                  }}
                />
              </TabsContent>

              <TabsContent value="repository" className="h-full mt-0">
                <RepositoryTab
                  data={{
                    owner,
                    repo,
                    savedOwner,
                    savedRepo,
                    error: repoError,
                  }}
                  handlers={{
                    onOwnerChange: setOwner,
                    onRepoChange: setRepo,
                    onSaveRepository: handleSaveRepository,
                    onDeleteRepository: handleDeleteRepository,
                  }}
                />
              </TabsContent>

              <TabsContent value="secrets" className="h-full mt-0">
                {!canAccessSecrets ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-orange-100 rounded-full">
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        설정이 필요합니다
                      </h3>
                      <p className="text-sm text-gray-600">
                        시크릿을 관리하려면 GitHub 토큰과 레포지토리 설정이 필요합니다.
                      </p>
                      <div className="flex gap-2 justify-center">
                        {!hasToken && (
                          <Button
                            onClick={() => setActiveTab('token')}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            토큰 설정
                          </Button>
                        )}
                        {!hasRepository && hasToken && (
                          <Button
                            onClick={() => setActiveTab('repository')}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            레포지토리 설정
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <SecretsTab
                    data={{
                      availableSecrets,
                      missingSecrets,
                      loading: secretsLoading,
                      error: secretsError,
                      groupedSecrets: secretsData?.data?.groupedSecrets,
                    }}
                    form={{
                      showForm: showSecretForm,
                      secretsToCreate,
                      showValues,
                      isCreating: isCreatingSecrets,
                    }}
                    handlers={{
                      onDeleteSecret: handleDeleteSecret,
                      onCreateMissingSecrets: handleCreateMissingSecrets,
                      onAddSecretForm: handleAddSecretForm,
                      onRemoveSecretForm: handleRemoveSecretForm,
                      onUpdateSecretForm: handleUpdateSecretForm,
                      onToggleValueVisibility: handleToggleValueVisibility,
                      onCloseSecretForm: handleCloseSecretForm,
                      onCreateSecrets: handleCreateSecrets,
                    }}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
