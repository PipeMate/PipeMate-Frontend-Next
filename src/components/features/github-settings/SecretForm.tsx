import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, EyeOff, Plus, Save, Shield, X } from 'lucide-react';

// * 시크릿 폼 데이터 인터페이스
interface SecretFormData {
  name: string;
  value: string;
}

// * 시크릿 폼 props 인터페이스
interface SecretFormProps {
  secrets: SecretFormData[];
  showValues: Record<number, boolean>;
  onAddSecret: () => void;
  onRemoveSecret: (index: number) => void;
  onUpdateSecret: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onClose: () => void;
  onCreateSecrets: () => void;
}

export function SecretForm({
  secrets,
  showValues,
  onAddSecret,
  onRemoveSecret,
  onUpdateSecret,
  onToggleValueVisibility,
  onClose,
  onCreateSecrets,
}: SecretFormProps) {
  // * 그룹 추출 함수 - 시크릿 이름에서 그룹명을 추출
  const extractGroup = (secretName: string): string => {
    if (!secretName) return 'UNKNOWN';
    const parts = secretName.split('_');
    return parts.length > 1 ? parts[0] : 'UNKNOWN';
  };

  // * 그룹별로 정렬된 시크릿 - 시크릿을 그룹별로 분류하여 정렬
  const groupedSecrets = useMemo(() => {
    const groups: { [key: string]: { secret: SecretFormData; index: number }[] } = {};

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

  // * 저장 가능한 시크릿이 있는지 확인 - 모든 시크릿이 이름과 값을 가지고 있는지 검증
  const hasValidSecrets =
    secrets.length > 0 && secrets.every((secret) => secret.name && secret.value);

  return (
    <div className="h-full flex flex-col justify-between">
      {/* * 헤더 섹션 */}
      <div className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">시크릿 생성</h3>
            <p className="text-sm text-gray-500">새로운 시크릿을 추가하세요</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* * 시크릿 폼 내용 */}
      <div className="flex-1 space-y-4 overflow-y-auto pt-4 max-h-[320px]">
        {groupedSecrets.map(([groupName, groupSecrets]) => (
          <div key={groupName} className="space-y-3">
            {/* * 그룹 헤더 */}
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-700">{groupName} 그룹</h4>
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
                <div className="flex items-center justify-between">
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
                  {/* * 시크릿 삭제 버튼 - 여러 개일 때만 표시 */}
                  {secrets.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveSecret(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      ×
                    </Button>
                  )}
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
                      onUpdateSecret(index, 'name', value);
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
                      onChange={(e) => onUpdateSecret(index, 'value', e.target.value)}
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

      {/* * 액션 버튼들 */}
      <div className="flex gap-3 flex-shrink-0 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onAddSecret}
          className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          시크릿 추가
        </Button>
        <Button
          type="button"
          onClick={onCreateSecrets}
          disabled={!hasValidSecrets}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-colors duration-200"
        >
          <Save className="h-4 w-4 mr-2" />
          저장
        </Button>
      </div>
    </div>
  );
}
