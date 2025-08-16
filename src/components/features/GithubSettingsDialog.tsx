import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Github, GitBranch, Lock } from 'lucide-react';
import { STORAGES } from '@/config/appConstants';
import {
  setCookie,
  getCookie,
  deleteCookie,
  setRepositoryConfig,
  getRepositoryConfig,
  deleteRepositoryConfig,
} from '@/lib/cookieUtils';
import { useRepository } from '@/contexts/RepositoryContext';
import { useSecrets, useDeleteSecret } from '@/api';
import { useSecretManager } from '@/app/editor/hooks/useSecretManager';

// 분리된 탭 컴포넌트들
import { TokenTab } from './github-settings/TokenTab';
import { RepositoryTab } from './github-settings/RepositoryTab';
import { SecretsTab } from './github-settings/SecretsTab';

interface GithubSettingsDialogProps {
  trigger?: React.ReactNode;
  onTokenChange?: (token: string | null) => void;
  missingSecrets?: string[];
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
}: GithubSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('token');

  // 토큰 관련 상태
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');

  // 레포지토리 관련 상태
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [savedOwner, setSavedOwner] = useState<string | null>(null);
  const [savedRepo, setSavedRepo] = useState<string | null>(null);
  const [repoError, setRepoError] = useState('');

  // 시크릿 관련 상태
  const [showSecretForm, setShowSecretForm] = useState(false);
  const [secretsToCreate, setSecretsToCreate] = useState<SecretFormData[]>([]);
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});
  const [isCreatingSecrets, setIsCreatingSecrets] = useState(false);

  const { setRepository } = useRepository();

  // 새로운 시크릿 관리 훅 사용
  const {
    secrets: availableSecrets,
    isLoading: secretsLoading,
    error: secretsError,
    createSecret,
    refreshSecrets,
  } = useSecretManager();

  // 레거시 API 훅 (삭제용으로만 사용)
  const deleteSecretMutation = useDeleteSecret();

  // 기존 API 훅 (호환성 유지)
  const { data: secretsData, isLoading } = useSecrets(owner || '', repo || '');

  useEffect(() => {
    if (open) {
      // 토큰 정보 로드
      const storedToken = getCookie(STORAGES.GITHUB_TOKEN);
      setSavedToken(storedToken);
      setToken(storedToken || '');

      // 레포지토리 정보 로드
      const repoConfig = getRepositoryConfig();
      setSavedOwner(repoConfig.owner);
      setSavedRepo(repoConfig.repo);
      setOwner(repoConfig.owner || '');
      setRepo(repoConfig.repo || '');
    }
  }, [open]);

  // 시크릿 새로고침 (레포지토리 변경 시)
  useEffect(() => {
    if (open && owner && repo) {
      refreshSecrets();
    }
  }, [open, owner, repo, refreshSecrets]);

  // 토큰 관련 핸들러
  const handleSaveToken = () => {
    if (!token.trim()) {
      setTokenError('토큰을 입력해주세요.');
      return;
    }
    setCookie(STORAGES.GITHUB_TOKEN, token.trim(), { days: 30 });
    setSavedToken(token.trim());
    setTokenError('');
    onTokenChange?.(token.trim());
  };

  const handleDeleteToken = () => {
    deleteCookie(STORAGES.GITHUB_TOKEN);
    setSavedToken(null);
    setToken('');
    setTokenError('');
    onTokenChange?.(null);
  };

  // 레포지토리 관련 핸들러
  const handleSaveRepository = () => {
    if (!owner.trim()) {
      setRepoError('소유자를 입력해주세요.');
      return;
    }
    if (!repo.trim()) {
      setRepoError('레포지토리를 입력해주세요.');
      return;
    }

    setRepositoryConfig(owner.trim(), repo.trim());
    setSavedOwner(owner.trim());
    setSavedRepo(repo.trim());
    setRepository(owner.trim(), repo.trim());
    setRepoError('');
  };

  const handleDeleteRepository = () => {
    deleteRepositoryConfig();
    setSavedOwner(null);
    setSavedRepo(null);
    setOwner('');
    setRepo('');
    setRepository('', '');
    setRepoError('');
  };

  // 시크릿 관련 핸들러
  const handleDeleteSecret = async (secretName: string) => {
    if (!owner || !repo) return;

    try {
      await deleteSecretMutation.mutateAsync({
        owner,
        repo,
        secretName,
      });
      refreshSecrets();
    } catch (error) {
      console.error('Secret 삭제 실패:', error);
    }
  };

  const handleCreateMissingSecrets = (secretNames: string[]) => {
    if (secretNames.length > 0) {
      const initialSecrets = secretNames.map((name) => ({
        name,
        value: '',
        description: '',
      }));
      setSecretsToCreate(initialSecrets);
    } else {
      setSecretsToCreate([{ name: '', value: '', description: '' }]);
    }
    setShowSecretForm(true);
  };

  const handleAddSecretForm = () => {
    setSecretsToCreate([...secretsToCreate, { name: '', value: '', description: '' }]);
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
    <Dialog open={open} onOpenChange={setOpen}>
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
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
