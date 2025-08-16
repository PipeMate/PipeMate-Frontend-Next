import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, EyeOff, Plus, X } from 'lucide-react';

interface SecretFormData {
  name: string;
  value: string;
  description?: string;
}

interface SecretFormProps {
  secrets: SecretFormData[];
  showValues: Record<number, boolean>;
  onAddSecret: () => void;
  onRemoveSecret: (index: number) => void;
  onUpdateSecret: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onClose: () => void;
}

export function SecretForm({
  secrets,
  showValues,
  onAddSecret,
  onRemoveSecret,
  onUpdateSecret,
  onToggleValueVisibility,
  onClose,
}: SecretFormProps) {
  // 그룹 추출 함수
  const extractGroup = (secretName: string): string => {
    if (!secretName) return 'UNKNOWN';
    const parts = secretName.split('_');
    return parts.length > 1 ? parts[0] : 'UNKNOWN';
  };

  // 그룹별로 정렬된 시크릿
  const groupedSecrets = useMemo(() => {
    const groups: { [key: string]: { secret: SecretFormData; index: number }[] } = {};

    secrets.forEach((secret, index) => {
      const group = extractGroup(secret.name);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push({ secret, index });
    });

    // 그룹명으로 정렬
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [secrets]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">시크릿 생성</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pt-4">
        {groupedSecrets.map(([groupName, groupSecrets]) => (
          <div key={groupName} className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-700">{groupName} 그룹</h4>
              <Badge variant="outline" className="text-xs">
                {groupSecrets.length}개
              </Badge>
            </div>

            {groupSecrets.map(({ secret, index }) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">시크릿 #{index + 1}</div>
                    <Badge variant="secondary" className="text-xs">
                      {groupName}
                    </Badge>
                  </div>
                  {secrets.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveSecret(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">이름</label>
                  <Input
                    value={secret.name}
                    onChange={(e) => {
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, '');
                      onUpdateSecret(index, 'name', value);
                    }}
                    placeholder="SECRET_NAME"
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">값</label>
                  <div className="relative">
                    <Input
                      type={showValues[index] ? 'text' : 'password'}
                      value={secret.value}
                      onChange={(e) => onUpdateSecret(index, 'value', e.target.value)}
                      placeholder="시크릿 값을 입력하세요..."
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
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

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    설명 (선택사항)
                  </label>
                  <Input
                    value={secret.description || ''}
                    onChange={(e) => onUpdateSecret(index, 'description', e.target.value)}
                    placeholder="시크릿에 대한 설명..."
                  />
                </div>

                {secret.name && secret.value && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    준비 완료
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAddSecret}
        className="w-full flex-shrink-0 pt-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        시크릿 추가
      </Button>
    </div>
  );
}
