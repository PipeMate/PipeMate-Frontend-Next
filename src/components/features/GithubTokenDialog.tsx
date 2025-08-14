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
import { useSecrets, useCreateOrUpdateSecret, useDeleteSecret } from '@/api/hooks';

interface Secret {
  name: string;
  value: string;
  isVisible: boolean;
}

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

  // Secrets 관련 상태
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [_editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [newSecret, setNewSecret] = useState({
    name: '',
    value: '',
    isVisible: false,
  });

  // API 훅 사용
  const { data: secretsData, isLoading } = useSecrets(owner || '', repo || '');
  const createOrUpdateSecret = useCreateOrUpdateSecret();
  const deleteSecret = useDeleteSecret();

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

  // 기존 secrets 로드
  useEffect(() => {
    if (secretsData?.data?.secrets) {
      const existingSecrets = secretsData.data.secrets.map((secret: any) => ({
        name: secret.name,
        value: '', // 보안상 값은 표시하지 않음
        isVisible: false,
      }));
      setSecrets(existingSecrets);
    }
  }, [secretsData]);

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

  // Secrets 관련 함수들
  const handleAddSecret = () => {
    if (!newSecret.name || !newSecret.value) return;

    setSecrets([...secrets, { ...newSecret }]);
    setNewSecret({ name: '', value: '', isVisible: false });
  };

  const handleEditSecret = (index: number) => {
    setEditingSecret(secrets[index]);
  };

  const _handleSaveSecret = async (secret: Secret) => {
    if (!owner || !repo) return;

    try {
      await createOrUpdateSecret.mutateAsync({
        owner,
        repo,
        secretName: secret.name,
        data: {
          value: secret.value,
        },
      });

      // 로컬 상태 업데이트
      const updatedSecrets = secrets.map((s) => (s.name === secret.name ? secret : s));
      setSecrets(updatedSecrets);
      setEditingSecret(null);
    } catch (error) {
      console.error('Secret 저장 실패:', error);
    }
  };

  const handleDeleteSecret = async (secretName: string) => {
    if (!owner || !repo) return;

    try {
      await deleteSecret.mutateAsync({
        owner,
        repo,
        secretName,
      });

      // 로컬 상태 업데이트
      setSecrets(secrets.filter((s) => s.name !== secretName));
    } catch (error) {
      console.error('Secret 삭제 실패:', error);
    }
  };

  const toggleVisibility = (index: number) => {
    const updatedSecrets = [...secrets];
    updatedSecrets[index].isVisible = !updatedSecrets[index].isVisible;
    setSecrets(updatedSecrets);
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
            <Tabs defaultValue="existing">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">기존 Secrets</TabsTrigger>
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
                {isLoading ? (
                  <LoadingSpinner message="Secrets를 불러오는 중..." />
                ) : (
                  <>
                    {/* 새 Secret 추가 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />새 Secret 추가
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Secret 이름
                            </label>
                            <Input
                              placeholder="예: AWS_ACCESS_KEY"
                              value={newSecret.name}
                              onChange={(e) =>
                                setNewSecret({
                                  ...newSecret,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Secret 값
                            </label>
                            <div className="relative">
                              <Input
                                type={newSecret.isVisible ? 'text' : 'password'}
                                placeholder="Secret 값을 입력하세요"
                                value={newSecret.value}
                                onChange={(e) =>
                                  setNewSecret({
                                    ...newSecret,
                                    value: e.target.value,
                                  })
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() =>
                                  setNewSecret({
                                    ...newSecret,
                                    isVisible: !newSecret.isVisible,
                                  })
                                }
                              >
                                {newSecret.isVisible ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleAddSecret}
                          disabled={!newSecret.name || !newSecret.value}
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Secret 추가
                        </Button>
                      </CardContent>
                    </Card>

                    {/* 기존 Secrets 목록 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        기존 Secrets ({secrets.length})
                      </h3>
                      {secrets.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                              아직 생성된 Secret이 없습니다.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        secrets.map((secret, index) => (
                          <Card key={secret.name}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-900">
                                      {secret.name}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <Input
                                      type={secret.isVisible ? 'text' : 'password'}
                                      value={secret.value}
                                      readOnly
                                      className="bg-gray-50"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                      onClick={() => toggleVisibility(index)}
                                    >
                                      {secret.isVisible ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSecret(index)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteSecret(secret.name)}
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        누락된 Secrets ({missingSecrets.length})
                      </h3>
                      {missingSecrets.map((secretName) => (
                        <Card key={secretName}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-gray-900">
                                  {secretName}
                                </span>
                                <Badge variant="secondary">누락됨</Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setNewSecret({
                                    name: secretName,
                                    value: '',
                                    isVisible: false,
                                  });
                                }}
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
    </Dialog>
  );
}
