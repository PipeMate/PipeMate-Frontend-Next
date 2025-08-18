'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSecretManager } from '../hooks/useSecretManager';
import { AlertCircle, CheckCircle, Eye, EyeOff, Save, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

interface SecretCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingSecrets?: string[];
  onSecretsCreated?: () => void;
}

interface SecretForm {
  name: string;
  value: string;
}

export const SecretCreateDialog: React.FC<SecretCreateDialogProps> = ({
  isOpen,
  onClose,
  missingSecrets = [],
  onSecretsCreated,
}) => {
  const { createSecret, isLoading, error } = useSecretManager();

  const [secrets, setSecrets] = useState<SecretForm[]>([]);
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);

  // * 그룹 추출 함수 - 시크릿 이름에서 그룹명을 추출
  const extractGroup = (secretName: string): string => {
    if (!secretName) return 'UNKNOWN';
    const parts = secretName.split('_');
    return parts.length > 1 ? parts[0] : 'UNKNOWN';
  };

  // * 그룹별로 정렬된 시크릿 - 시크릿을 그룹별로 분류하여 정렬
  const groupedSecrets = useMemo(() => {
    const groups: { [key: string]: { secret: SecretForm; index: number }[] } = {};

    secrets.forEach((secret, index) => {
      const group = extractGroup(secret.name);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push({ secret, index });
    });

    // * 그룹명으로 정렬
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [secrets]);

  // 누락된 시크릿을 기반으로 초기 폼 설정
  useEffect(() => {
    if (isOpen && missingSecrets.length > 0) {
      const initialSecrets = missingSecrets.map((name) => ({
        name,
        value: '',
      }));
      setSecrets(initialSecrets);
    } else if (isOpen && secrets.length === 0) {
      // 새 시크릿 추가
      setSecrets([{ name: '', value: '' }]);
    }
  }, [isOpen, missingSecrets, secrets.length]);

  // 시크릿 업데이트
  const updateSecret = (index: number, field: keyof SecretForm, value: string) => {
    const newSecrets = [...secrets];
    newSecrets[index] = { ...newSecrets[index], [field]: value };
    setSecrets(newSecrets);
  };

  // 시크릿 가시성 토글
  const toggleVisibility = (index: number) => {
    setShowValues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 시크릿 생성
  const handleCreate = async () => {
    const validSecrets = secrets.filter((s) => s.name.trim() && s.value.trim());

    if (validSecrets.length === 0) {
      toast.error('최소 하나의 시크릿을 입력해주세요.');
      return;
    }

    setIsCreating(true);

    try {
      // 모든 시크릿 생성
      await Promise.all(
        validSecrets.map((secret) =>
          createSecret(secret.name.trim(), secret.value.trim()),
        ),
      );

      toast.success(`${validSecrets.length}개의 시크릿이 생성되었습니다.`);
      onSecretsCreated?.();
      handleClose();
    } catch {
      // 에러는 useSecretManager에서 처리됨
    } finally {
      setIsCreating(false);
    }
  };

  // 다이얼로그 닫기
  const handleClose = () => {
    setSecrets([]);
    setShowValues({});
    onClose();
  };

  // 유효성 검사
  const isValid = secrets.some((s) => s.name.trim() && s.value.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">시크릿 생성</span>
              <span className="text-sm text-gray-500">누락된 시크릿을 추가하세요</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* 안내 메시지 */}
          {missingSecrets.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                다음 시크릿들이 누락되었습니다:
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {missingSecrets.map((secret) => (
                  <Badge key={secret} variant="outline" className="text-yellow-700">
                    {secret}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* 시크릿 폼들 */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {groupedSecrets.map(([groupName, groupSecrets]) => (
              <div key={groupName} className="space-y-3">
                {/* * 그룹 헤더 */}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {groupName} 그룹
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {groupSecrets.length}개
                  </Badge>
                </div>

                {/* * 그룹 내 시크릿들 */}
                {groupSecrets.map(({ secret, index }) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* * 시크릿 헤더 */}
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

                    {/* * 시크릿 이름 입력 필드 */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block font-medium">
                        이름 (예: AWS_ACCESS_KEY, DOCKER_PASSWORD)
                      </label>
                      <Input
                        value={secret.name}
                        onChange={(e) => {
                          // * 대문자와 언더스코어만 허용하도록 필터링
                          const value = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_]/g, '');
                          updateSecret(index, 'name', value);
                        }}
                        placeholder="AWS_ACCESS_KEY"
                        className="font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* * 시크릿 값 입력 필드 */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block font-medium">
                        값
                      </label>
                      <div className="relative">
                        <Input
                          type={showValues[index] ? 'text' : 'password'}
                          value={secret.value}
                          onChange={(e) => updateSecret(index, 'value', e.target.value)}
                          placeholder="시크릿 값을 입력하세요..."
                          className="pr-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        {/* * 값 표시/숨김 토글 버튼 */}
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => toggleVisibility(index)}
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

                    {/* * 준비 완료 표시 */}
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
        </div>

        <DialogFooter className="flex gap-3 flex-shrink-0 pt-4 border-t border-gray-200 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isValid || isCreating || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-colors duration-200"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                생성 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
