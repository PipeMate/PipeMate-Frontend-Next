'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Trash2, CheckCircle, AlertCircle, Key, Shield } from 'lucide-react';
import { useSecretManager } from '../hooks/useSecretManager';
import { SecretCreateDialog } from './SecretCreateDialog';

interface SecretManagementPanelProps {
  requiredSecrets: string[];
  onSecretsUpdated?: () => void;
}

export const SecretManagementPanel: React.FC<SecretManagementPanelProps> = ({
  requiredSecrets = [],
  onSecretsUpdated,
}) => {
  // 시크릿 관리 훅
  const {
    secrets: availableSecrets,
    isLoading,
    error: secretsError,
    createSecret,
    deleteSecret,
    refreshSecrets,
  } = useSecretManager();

  // 상태 관리
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [secretToDelete, setSecretToDelete] = useState<string | null>(null);
  const [secretsToCreate, setSecretsToCreate] = useState<string[]>([]);

  // 누락된 시크릿과 존재하는 시크릿 분류
  const missingSecrets = requiredSecrets.filter(
    (required) => !availableSecrets.includes(required),
  );
  const existingRequiredSecrets = requiredSecrets.filter((required) =>
    availableSecrets.includes(required),
  );
  const otherSecrets = availableSecrets.filter(
    (secret) => !requiredSecrets.includes(secret),
  );

  // 시크릿 생성 다이얼로그 열기
  const openCreateDialog = (missingSecretsToAdd?: string[]) => {
    setSecretsToCreate(missingSecretsToAdd || []);
    setCreateDialogOpen(true);
  };

  // 시크릿 삭제
  const handleDeleteSecret = async () => {
    if (!secretToDelete) return;

    try {
      await deleteSecret(secretToDelete);
      setDeleteDialogOpen(false);
      setSecretToDelete(null);
      onSecretsUpdated?.();
    } catch (error) {
      // 에러는 useSecretManager에서 이미 처리됨
    }
  };

  // 삭제 확인 다이얼로그 열기
  const confirmDelete = (secretName: string) => {
    setSecretToDelete(secretName);
    setDeleteDialogOpen(true);
  };

  // 시크릿 생성 완료 핸들러
  const handleSecretsCreated = () => {
    setCreateDialogOpen(false);
    setSecretsToCreate([]);
    onSecretsUpdated?.();
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">시크릿 관리</h3>
        </div>
        <Button onClick={() => openCreateDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />새 시크릿 추가
        </Button>
      </div>

      {/* 에러 표시 */}
      {secretsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertCircle className="h-4 w-4" />
            시크릿을 불러오는 중 오류가 발생했습니다: {secretsError}
          </div>
        </div>
      )}

      {/* 탭 구조 */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">
            상태 개요
            {missingSecrets.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {missingSecrets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="required">
            필수 시크릿
            <Badge variant="secondary" className="ml-2">
              {requiredSecrets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            전체 시크릿
            <Badge variant="outline" className="ml-2">
              {availableSecrets.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* 상태 개요 탭 */}
        <TabsContent value="status" className="space-y-4">
          {missingSecrets.length > 0 ? (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  누락된 시크릿 ({missingSecrets.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {missingSecrets.map((secret) => (
                      <Badge key={secret} variant="destructive">
                        {secret}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => openCreateDialog(missingSecrets)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    누락된 시크릿 모두 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-green-800 font-medium">
                  모든 필수 시크릿이 설정되어 있습니다!
                </p>
              </CardContent>
            </Card>
          )}

          {/* 빠른 통계 */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {existingRequiredSecrets.length}
                </div>
                <div className="text-sm text-gray-600">설정됨</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {missingSecrets.length}
                </div>
                <div className="text-sm text-gray-600">누락됨</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {availableSecrets.length}
                </div>
                <div className="text-sm text-gray-600">전체</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 필수 시크릿 탭 */}
        <TabsContent value="required" className="space-y-4">
          {requiredSecrets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              이 블럭에는 필수 시크릿이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {requiredSecrets.map((secret) => {
                const isAvailable = availableSecrets.includes(secret);
                return (
                  <Card
                    key={secret}
                    className={isAvailable ? 'border-green-200' : 'border-red-200'}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key
                            className={`w-4 h-4 ${
                              isAvailable ? 'text-green-600' : 'text-red-600'
                            }`}
                          />
                          <span className="font-medium">{secret}</span>
                          <Badge variant={isAvailable ? 'default' : 'destructive'}>
                            {isAvailable ? '설정됨' : '누락됨'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmDelete(secret)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => openCreateDialog([secret])}>
                              <Plus className="w-4 h-4 mr-2" />
                              생성
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 전체 시크릿 탭 */}
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">시크릿을 불러오는 중...</p>
            </div>
          ) : availableSecrets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              아직 생성된 시크릿이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {availableSecrets.map((secret) => {
                const isRequired = requiredSecrets.includes(secret);
                return (
                  <Card key={secret}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Key className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{secret}</span>
                          {isRequired && <Badge variant="secondary">필수</Badge>}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmDelete(secret)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 시크릿 생성 다이얼로그 */}
      <SecretCreateDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        missingSecrets={secretsToCreate}
        onSecretsCreated={handleSecretsCreated}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              시크릿 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{secretToDelete}</strong> 시크릿을 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없으며, 이 시크릿을 사용하는 워크플로우가 실패할 수
                있습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSecret}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
