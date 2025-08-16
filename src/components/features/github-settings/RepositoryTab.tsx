import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InlineErrorMessage } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

interface RepositoryData {
  owner: string;
  repo: string;
  savedOwner: string | null;
  savedRepo: string | null;
  error: string;
}

interface RepositoryHandlers {
  onOwnerChange: (owner: string) => void;
  onRepoChange: (repo: string) => void;
  onSaveRepository: () => void;
  onDeleteRepository: () => void;
}

interface RepositoryTabProps {
  data: RepositoryData;
  handlers: RepositoryHandlers;
}

export function RepositoryTab({ data, handlers }: RepositoryTabProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                소유자 (Owner)
              </label>
              <Input
                placeholder="username"
                value={data.owner}
                onChange={(e) => handlers.onOwnerChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                레포지토리 (Repository)
              </label>
              <Input
                placeholder="repo-name"
                value={data.repo}
                onChange={(e) => handlers.onRepoChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          {data.error && <InlineErrorMessage message={data.error} />}

          {data.savedOwner && data.savedRepo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {data.savedOwner}/{data.savedRepo}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-shrink-0 pt-6">
        <Button
          onClick={handlers.onSaveRepository}
          disabled={!data.owner.trim() || !data.repo.trim()}
          className="flex-1"
        >
          레포지토리 저장
        </Button>
        {data.savedOwner && data.savedRepo && (
          <Button variant="destructive" onClick={handlers.onDeleteRepository}>
            레포지토리 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
