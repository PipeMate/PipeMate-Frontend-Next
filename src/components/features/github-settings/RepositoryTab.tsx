import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InlineErrorMessage } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

interface RepositoryTabProps {
  owner: string;
  repo: string;
  savedOwner: string | null;
  savedRepo: string | null;
  repoError: string;
  onOwnerChange: (owner: string) => void;
  onRepoChange: (repo: string) => void;
  onSaveRepository: () => void;
  onDeleteRepository: () => void;
}

export function RepositoryTab({
  owner,
  repo,
  savedOwner,
  savedRepo,
  repoError,
  onOwnerChange,
  onRepoChange,
  onSaveRepository,
  onDeleteRepository,
}: RepositoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              소유자 (Owner)
            </label>
            <Input
              placeholder="username"
              value={owner}
              onChange={(e) => onOwnerChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              레포지토리 (Repository)
            </label>
            <Input
              placeholder="repo-name"
              value={repo}
              onChange={(e) => onRepoChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        {repoError && <InlineErrorMessage message={repoError} />}

        {savedOwner && savedRepo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {savedOwner}/{savedRepo}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onSaveRepository}
          disabled={!owner.trim() || !repo.trim()}
          className="flex-1"
        >
          레포지토리 저장
        </Button>
        {savedOwner && savedRepo && (
          <Button variant="destructive" onClick={onDeleteRepository}>
            레포지토리 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
