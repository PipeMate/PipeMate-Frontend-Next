import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InlineErrorMessage } from '@/components/ui';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

interface TokenData {
  token: string;
  savedToken: string | null;
  error: string;
}

interface TokenHandlers {
  onTokenChange: (token: string) => void;
  onSaveToken: () => void;
  onDeleteToken: () => void;
}

interface TokenTabProps {
  data: TokenData;
  handlers: TokenHandlers;
}

export function TokenTab({ data, handlers }: TokenTabProps) {
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxx"
                value={data.token}
                onChange={(e) => handlers.onTokenChange(e.target.value)}
                className="w-full pr-12"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
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
            {data.error && <InlineErrorMessage message={data.error} />}
          </div>

          {data.savedToken && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">토큰이 설정되어 있습니다.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-shrink-0">
        <Button
          onClick={handlers.onSaveToken}
          disabled={!data.token.trim()}
          className="flex-1"
        >
          토큰 저장
        </Button>
        {data.savedToken && (
          <Button variant="destructive" onClick={handlers.onDeleteToken}>
            토큰 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
