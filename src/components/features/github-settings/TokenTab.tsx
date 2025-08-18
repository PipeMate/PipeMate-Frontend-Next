import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Eye, EyeOff, Key, Save, Trash2 } from 'lucide-react';

// * 토큰 데이터 인터페이스
interface TokenData {
  token: string;
  savedToken: string | null;
  error: string | null;
}

// * 토큰 핸들러 인터페이스
interface TokenHandlers {
  onTokenChange: (token: string) => void;
  onSaveToken: () => void;
  onDeleteToken: () => void;
}

// * 토큰 탭 props 인터페이스
interface TokenTabProps {
  data: TokenData;
  handlers: TokenHandlers;
}

export function TokenTab({ data, handlers }: TokenTabProps) {
  // * 토큰 표시/숨김 상태
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          {/* * 헤더 섹션 */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Key className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">GitHub 토큰</h3>
              <p className="text-sm text-gray-500">
                GitHub API에 접근하기 위한 개인 액세스 토큰을 입력하세요.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* * 토큰 입력 필드 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Personal Access Token
            </label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={data.token}
                onChange={(e) => handlers.onTokenChange(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="pr-20 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              />
              {/* * 토큰 표시/숨김 토글 버튼 */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* * 에러 메시지 표시 */}
          {data.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{data.error}</p>
            </div>
          )}
        </div>

        {/* * 토큰 생성 가이드 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded">
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                GitHub 토큰이 없으신가요?
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                GitHub에서 Personal Access Token을 생성하여 PipeMate가 GitHub에 접근할 수
                있도록 합니다.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  GitHub 토큰 생성하기
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* * 액션 버튼들 */}
      <div className="flex gap-3 flex-shrink-0 pt-6">
        <Button
          onClick={handlers.onSaveToken}
          disabled={!data.token}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-gray-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-colors duration-200"
        >
          <Save className="h-4 w-4 mr-2" />
          토큰 저장
        </Button>
        {/* * 저장된 토큰이 있을 때만 삭제 버튼 표시 */}
        {data.savedToken && (
          <Button
            onClick={handlers.onDeleteToken}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            토큰 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
