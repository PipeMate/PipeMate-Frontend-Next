'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Label 컴포넌트 대신 div 사용
// Textarea 컴포넌트 대신 textarea 엘리먼트 사용
import { Badge } from '@/components/ui/badge';
import { useSecretManager } from '../hooks/useSecretManager';
import {
  Lock,
  Plus,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Key,
} from 'lucide-react';
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
  description?: string;
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

  // 누락된 시크릿을 기반으로 초기 폼 설정
  useEffect(() => {
    if (isOpen && missingSecrets.length > 0) {
      const initialSecrets = missingSecrets.map((name) => ({
        name,
        value: '',
        description: '',
      }));
      setSecrets(initialSecrets);
    } else if (isOpen && secrets.length === 0) {
      // 새 시크릿 추가
      setSecrets([{ name: '', value: '', description: '' }]);
    }
  }, [isOpen, missingSecrets, secrets.length]);

  // 시크릿 추가
  const addSecret = () => {
    setSecrets([...secrets, { name: '', value: '', description: '' }]);
  };

  // 시크릿 제거
  const removeSecret = (index: number) => {
    const newSecrets = secrets.filter((_, i) => i !== index);
    setSecrets(newSecrets);
  };

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

  // 시크릿 값 복사
  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('값이 클립보드에 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-500" />
            시크릿 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 안내 메시지 */}
          {missingSecrets.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* 시크릿 폼들 */}
          <div className="space-y-4">
            {secrets.map((secret, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">시크릿 #{index + 1}</div>
                  {secrets.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSecret(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  )}
                </div>

                {/* 시크릿 이름 */}
                <div>
                  <label
                    htmlFor={`secret-name-${index}`}
                    className="text-xs text-gray-600"
                  >
                    이름 (대문자, 숫자, 언더스코어만 사용)
                  </label>
                  <Input
                    id={`secret-name-${index}`}
                    value={secret.name}
                    onChange={(e) => {
                      // 대문자, 숫자, 언더스코어만 허용
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, '');
                      updateSecret(index, 'name', value);
                    }}
                    placeholder="SECRET_NAME"
                    className="font-mono"
                  />
                </div>

                {/* 시크릿 값 */}
                <div>
                  <label
                    htmlFor={`secret-value-${index}`}
                    className="text-xs text-gray-600"
                  >
                    값
                  </label>
                  <div className="relative">
                    <textarea
                      id={`secret-value-${index}`}
                      value={secret.value}
                      onChange={(e) => updateSecret(index, 'value', e.target.value)}
                      placeholder="시크릿 값을 입력하세요..."
                      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-20 ${
                        showValues[index] ? '' : 'font-mono'
                      }`}
                      style={{
                        fontFamily: showValues[index] ? 'inherit' : 'monospace',
                        color: showValues[index] ? 'inherit' : 'transparent',
                        textShadow: showValues[index] ? 'none' : '0 0 0 #000',
                      }}
                      rows={3}
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleVisibility(index)}
                      >
                        {showValues[index] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      {secret.value && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyValue(secret.value)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 설명 (선택사항) */}
                <div>
                  <label
                    htmlFor={`secret-desc-${index}`}
                    className="text-xs text-gray-600"
                  >
                    설명 (선택사항)
                  </label>
                  <Input
                    id={`secret-desc-${index}`}
                    value={secret.description || ''}
                    onChange={(e) => updateSecret(index, 'description', e.target.value)}
                    placeholder="시크릿에 대한 설명..."
                  />
                </div>

                {/* 상태 표시 */}
                {secret.name && secret.value && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    준비 완료
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 시크릿 추가 버튼 */}
          <Button type="button" variant="outline" onClick={addSecret} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            시크릿 추가
          </Button>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isValid || isCreating || isLoading}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                시크릿 생성
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
