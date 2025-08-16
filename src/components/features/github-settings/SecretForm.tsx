import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">시크릿 생성</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {secrets.map((secret, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">시크릿 #{index + 1}</div>
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
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
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
              <label className="text-xs text-gray-600 mb-1 block">설명 (선택사항)</label>
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

      <Button type="button" variant="outline" onClick={onAddSecret} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        시크릿 추가
      </Button>
    </div>
  );
}
