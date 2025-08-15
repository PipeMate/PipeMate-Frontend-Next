'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecrets } from '@/api';
import { useRepository } from '@/contexts/RepositoryContext';
import { extractSecretsFromString } from '../utils/secretsDetector';
import { Lock, ChevronDown, Plus, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface SecretAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onCreateSecret?: (secretName: string) => void;
}

export const SecretAutocomplete: React.FC<SecretAutocompleteProps> = ({
  value,
  onChange,
  placeholder = '값을 입력하거나 ${{ secrets.SECRET_NAME }} 형태로 시크릿 사용',
  className,
  onCreateSecret,
}) => {
  const { owner, repo } = useRepository();
  const { data: secretsData, isLoading } = useSecrets(owner || '', repo || '');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 시크릿 목록 추출
  const availableSecrets = React.useMemo(() => {
    if (!secretsData?.data?.groupedSecrets) return [];

    const secrets: string[] = [];
    Object.values(secretsData.data.groupedSecrets).forEach((group: unknown) => {
      if (Array.isArray(group)) {
        group.forEach((secret: unknown) => {
          if (
            secret &&
            typeof secret === 'object' &&
            'name' in secret &&
            typeof secret.name === 'string'
          ) {
            secrets.push(secret.name);
          }
        });
      }
    });
    return secrets;
  }, [secretsData]);

  // 현재 값에서 시크릿 감지
  const detectedSecrets = React.useMemo(() => {
    return extractSecretsFromString(value);
  }, [value]);

  // 누락된 시크릿 확인
  const missingSecrets = React.useMemo(() => {
    return detectedSecrets.filter((secret) => !availableSecrets.includes(secret));
  }, [detectedSecrets, availableSecrets]);

  // 시크릿인지 확인
  const isSecretValue = React.useMemo(() => {
    return /^\s*\$\{\{\s*secrets\./i.test(value);
  }, [value]);

  // 드롭다운 필터링 (useMemo로 최적화)
  const filteredSecrets = React.useMemo(() => {
    if (!isDropdownOpen) return [];
    return availableSecrets.filter((secret) =>
      secret.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [availableSecrets, searchTerm, isDropdownOpen]);

  // 시크릿 선택 (useCallback로 최적화)
  const handleSecretSelect = React.useCallback(
    (secretName: string) => {
      const secretValue = `\${{ secrets.${secretName} }}`;
      onChange(secretValue);
      setIsDropdownOpen(false);
      setSearchTerm('');
    },
    [onChange],
  );

  // 시크릿 생성 요청
  const handleCreateSecret = React.useCallback(
    (secretName: string) => {
      onCreateSecret?.(secretName);
      setIsDropdownOpen(false);
    },
    [onCreateSecret],
  );

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        {/* 메인 입력 필드 */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={showSecretValue ? value : isSecretValue ? '••••••••' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`pr-20 ${className} ${
              isSecretValue ? 'border-blue-300 bg-blue-50' : ''
            } ${missingSecrets.length > 0 ? 'border-red-300 bg-red-50' : ''}`}
            onFocus={() => {
              if (isSecretValue) setShowSecretValue(true);
            }}
            onBlur={() => {
              if (isSecretValue) setShowSecretValue(false);
            }}
          />

          {/* 아이콘들 */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSecretValue && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowSecretValue(!showSecretValue)}
              >
                {showSecretValue ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setSearchTerm('');
              }}
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>

        {/* 시크릿 상태 표시 */}
        {isSecretValue && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Lock className="h-3 w-3 mr-1" />
            Secret
          </Badge>
        )}

        {missingSecrets.length > 0 && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            누락
          </Badge>
        )}
      </div>

      {/* 드롭다운 */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {/* 검색 */}
          <div className="p-2 border-b">
            <Input
              placeholder="시크릿 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>

          {/* 로딩 */}
          {isLoading && (
            <div className="p-3 text-sm text-gray-500 text-center">
              시크릿 목록을 불러오는 중...
            </div>
          )}

          {/* 시크릿 목록 */}
          {!isLoading && filteredSecrets.length > 0 && (
            <div className="py-1">
              {filteredSecrets.map((secretName) => (
                <button
                  key={secretName}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleSecretSelect(secretName)}
                >
                  <Key className="h-3 w-3 text-blue-500" />
                  <span className="font-mono">{secretName}</span>
                </button>
              ))}
            </div>
          )}

          {/* 검색된 시크릿이 없을 때 */}
          {!isLoading && filteredSecrets.length === 0 && searchTerm && (
            <div className="p-3">
              <div className="text-sm text-gray-500 mb-2">
                &apos;{searchTerm}&apos;과(와) 일치하는 시크릿이 없습니다.
              </div>
              {onCreateSecret && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCreateSecret(searchTerm)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  &apos;{searchTerm}&apos; 시크릿 생성
                </Button>
              )}
            </div>
          )}

          {/* 시크릿이 전혀 없을 때 */}
          {!isLoading && availableSecrets.length === 0 && !searchTerm && (
            <div className="p-3 text-sm text-gray-500 text-center">
              등록된 시크릿이 없습니다.
              <br />
              GitHub 리포지토리에서 시크릿을 먼저 생성하세요.
            </div>
          )}

          {/* 빠른 시크릿 패턴 제안 */}
          {!searchTerm && (
            <div className="border-t bg-gray-50 p-2">
              <div className="text-xs text-gray-600 mb-1">빠른 패턴:</div>
              <div className="flex flex-wrap gap-1">
                {['API_KEY', 'TOKEN', 'PASSWORD', 'DATABASE_URL'].map((pattern) => (
                  <button
                    key={pattern}
                    className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
                    onClick={() => handleSecretSelect(pattern)}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 누락된 시크릿 경고 */}
      {missingSecrets.length > 0 && (
        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          누락된 시크릿: {missingSecrets.join(', ')}
        </div>
      )}
    </div>
  );
};
