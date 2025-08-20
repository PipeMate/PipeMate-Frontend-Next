import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, Save, Trash2 } from 'lucide-react';

// * 레포지토리 데이터 인터페이스
interface RepositoryData {
  owner: string;
  repo: string;
  savedOwner: string | null;
  savedRepo: string | null;
  error: string | null;
}

// * 레포지토리 핸들러 인터페이스
interface RepositoryHandlers {
  onOwnerChange: (owner: string) => void;
  onRepoChange: (repo: string) => void;
  onSaveRepository: () => void;
  onDeleteRepository: () => void;
}

// * 레포지토리 탭 props 인터페이스
interface RepositoryTabProps {
  data: RepositoryData;
  handlers: RepositoryHandlers;
}

export function RepositoryTab({ data, handlers }: RepositoryTabProps) {
  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          {/* * 헤더 섹션 */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitBranch className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">GitHub 저장소</h3>
              <p className="text-sm text-gray-500">
                워크플로우를 실행할 GitHub 저장소 정보를 입력하세요.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* * 소유자 입력 필드 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              저장소 소유자 (Owner)
            </label>
            <Input
              value={data.owner}
              onChange={(e) => handlers.onOwnerChange(e.target.value)}
              placeholder="username"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* * 레포지토리 이름 입력 필드 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              저장소 이름 (Repository)
            </label>
            <Input
              value={data.repo}
              onChange={(e) => handlers.onRepoChange(e.target.value)}
              placeholder="repository-name"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* * 에러 메시지 표시 */}
          {data.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{data.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* * 액션 버튼들 */}
      <div className="flex gap-3 flex-shrink-0 pt-6">
        <Button
          onClick={handlers.onSaveRepository}
          disabled={!data.owner || !data.repo}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-colors duration-200"
        >
          <Save className="h-4 w-4 mr-2" />
          저장소 저장
        </Button>
        {/* * 저장된 레포지토리가 있을 때만 삭제 버튼 표시 */}
        {data.savedOwner && data.savedRepo && (
          <Button
            onClick={handlers.onDeleteRepository}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            저장소 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
