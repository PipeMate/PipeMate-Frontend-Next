import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InlineErrorMessage } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

interface TokenTabProps {
  token: string;
  savedToken: string | null;
  tokenError: string;
  onTokenChange: (token: string) => void;
  onSaveToken: () => void;
  onDeleteToken: () => void;
}

export function TokenTab({
  token,
  savedToken,
  tokenError,
  onTokenChange,
  onSaveToken,
  onDeleteToken,
}: TokenTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            GitHub Personal Access Token
          </label>
          <Input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            className="w-full"
          />
          {tokenError && <InlineErrorMessage message={tokenError} />}
        </div>

        {savedToken && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">토큰이 설정되어 있습니다.</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onSaveToken} disabled={!token.trim()} className="flex-1">
          토큰 저장
        </Button>
        {savedToken && (
          <Button variant="destructive" onClick={onDeleteToken}>
            토큰 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
