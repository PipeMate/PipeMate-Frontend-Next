import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, InlineErrorMessage, TabIconBadge } from '@/components/ui';
import {
  Github,
  GitBranch,
  Lock,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Key,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
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
import { useSecrets, useCreateOrUpdateSecret, useDeleteSecret } from '@/api';
import { SecretCreateDialog } from '@/app/github-actions-flow/components/SecretCreateDialog';
import { useSecretManager } from '@/app/github-actions-flow/hooks/useSecretManager';

// 레거시 Secret 인터페이스 (삭제 예정)
// interface Secret {
//   name: string;
//   value: string;
//   isVisible: boolean;
// }

interface GithubTokenDialogProps {
  trigger?: React.ReactNode;
  onTokenChange?: (token: string | null) => void;
  missingSecrets?: string[];
}

export function GithubTokenDialog({
  trigger,
  onTokenChange,
  missingSecrets = [],
}: GithubTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [savedOwner, setSavedOwner] = useState<string | null>(null);
  const [savedRepo, setSavedRepo] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [repoError, setRepoError] = useState('');
  const { setRepository } = useRepository();

  // 시크릿 다이얼로그 관련 상태
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [selectedMissingSecrets, setSelectedMissingSecrets] = useState<string[]>([]);

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

  const handleSaveToken = () => {
    if (!token.trim()) {
      setTokenError('토큰을 입력해주세요.');
      return;
    }
    setCookie(STORAGES.GITHUB_TOKEN, token.trim(), { days: 30 }); // 30일간 저장
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

  // 레거시 함수들 (삭제 예정)
  // const handleAddSecret = () => { ... };
  // const handleEditSecret = (index: number) => { ... };
  // const _handleSaveSecret = async (secret: Secret) => { ... };

  const handleDeleteSecret = async (secretName: string) => {
    if (!owner || !repo) return;

    try {
      await deleteSecretMutation.mutateAsync({
        owner,
        repo,
        secretName,
      });

      // 시크릿 목록 새로고침
      refreshSecrets();
    } catch (error) {
      console.error('Secret 삭제 실패:', error);
    }
  };

  // 레거시 함수 (삭제 예정)
  // const toggleVisibility = (index: number) => { ... };

  // 새로운 시크릿 관련 핸들러들
  const handleCreateMissingSecrets = (secretNames: string[]) => {
    setSelectedMissingSecrets(secretNames);
    setSecretDialogOpen(true);
  };

  const handleSecretsCreated = () => {
    // 시크릿 생성 후 목록 새로고침
    refreshSecrets();
    setSecretDialogOpen(false);
    setSelectedMissingSecrets([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 justify-center font-semibold text-base py-2 px-3 border-2 border-gray-200 hover:border-gray-400 transition-colors"
          >
            <Github className="text-[#24292f] size-5" />
            <span>설정 관리</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>GitHub 설정 관리</DialogTitle>
          <DialogDescription>
            GitHub API 연동을 위한 토큰, 레포지토리 설정, 그리고 Secrets를 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="token" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="token">
              <TabIconBadge icon={<Github size={16} />}>토큰</TabIconBadge>
            </TabsTrigger>
            <TabsTrigger value="repository">
              <TabIconBadge icon={<GitBranch size={16} />}>레포지토리</TabIconBadge>
            </TabsTrigger>
            <TabsTrigger value="secrets">
              <TabIconBadge icon={<Lock size={16} />} count={missingSecrets.length}>
                Secrets
              </TabIconBadge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="token" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Personal Access Token</label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
              {tokenError && <InlineErrorMessage message={tokenError} />}
            </div>

            <DialogFooter>
              <Button onClick={handleSaveToken} disabled={!token.trim()}>
                저장
              </Button>
              {savedToken && (
                <Button variant="destructive" onClick={handleDeleteToken} type="button">
                  삭제
                </Button>
              )}
            </DialogFooter>
          </TabsContent>

          <TabsContent value="repository" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">소유자 (Owner)</label>
                <Input
                  placeholder="GitHub 사용자명 또는 조직명"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">레포지토리 (Repository)</label>
                <Input
                  placeholder="레포지토리 이름"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                />
              </div>
              {repoError && <InlineErrorMessage message={repoError} />}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSaveRepository}
                disabled={!owner.trim() || !repo.trim()}
              >
                저장
              </Button>
              {savedOwner && savedRepo && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteRepository}
                  type="button"
                >
                  삭제
                </Button>
              )}
            </DialogFooter>
          </TabsContent>

          <TabsContent value="secrets" className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* 시크릿 에러 표시 */}
            {secretsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    시크릿을 불러오는 중 오류가 발생했습니다
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-1">{secretsError}</p>
              </div>
            )}

            <Tabs defaultValue="existing">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">
                  기존 Secrets
                  <Badge variant="secondary" className="ml-2">
                    {availableSecrets.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="missing">
                  누락된 Secrets
                  {missingSecrets.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {missingSecrets.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                {secretsLoading ? (
                  <LoadingSpinner message="Secrets를 불러오는 중..." />
                ) : (
                  <>
                    {/* 새 Secret 추가 버튼 */}
                    <Button
                      onClick={() => handleCreateMissingSecrets([])}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />새 Secret 추가
                    </Button>

                    {/* 기존 Secrets 목록 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        기존 Secrets ({availableSecrets.length})
                      </h3>
                      {availableSecrets.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                              아직 생성된 Secret이 없습니다.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        availableSecrets.map((secretName) => (
                          <Card key={secretName}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-900">
                                      {secretName}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    보안상 시크릿 값은 표시되지 않습니다
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteSecret(secretName)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="missing" className="space-y-4">
                {missingSecrets.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <p className="text-gray-600">
                        누락된 Secret이 없습니다. 모든 필요한 Secret이 설정되어 있습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          워크플로우에서 사용되는 Secret이 누락되었습니다.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          누락된 Secrets ({missingSecrets.length})
                        </h3>
                        <Button
                          onClick={() => handleCreateMissingSecrets(missingSecrets)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          모두 생성
                        </Button>
                      </div>

                      {missingSecrets.map((secretName) => (
                        <Card key={secretName}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-gray-900">
                                  {secretName}
                                </span>
                                <Badge variant="destructive">누락됨</Badge>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleCreateMissingSecrets([secretName])}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                생성
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <DialogClose asChild>
          <Button variant="secondary" type="button" className="w-full">
            닫기
          </Button>
        </DialogClose>
      </DialogContent>

      {/* 시크릿 생성 다이얼로그 */}
      <SecretCreateDialog
        isOpen={secretDialogOpen}
        onClose={() => {
          setSecretDialogOpen(false);
          setSelectedMissingSecrets([]);
        }}
        missingSecrets={selectedMissingSecrets}
        onSecretsCreated={handleSecretsCreated}
      />
    </Dialog>
  );
}
