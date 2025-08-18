import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusBadge, getStatusIcon } from './Status';
import { formatDuration, formatRelativeTime } from '../utils';
import type { WorkflowRun } from '../types';

interface WorkflowRunCardProps {
  run: WorkflowRun;
  isRunning?: boolean;
  isSelected?: boolean;
  onSelect: (run: WorkflowRun) => void;
}

// 워크플로우 이름을 표시용으로 포맷팅
const formatWorkflowName = (name: string, path: string) => {
  // name이 ".github/workflows/xxx.yml" 형태인 경우 파일명만 추출
  if (name.startsWith('.github/workflows/')) {
    return name.split('/').pop()?.replace('.yml', '') || name;
  }
  // name이 "Deploy Monitor" 같은 형태인 경우 그대로 사용
  return name;
};

// 브랜치명 안전하게 가져오기
const getBranchName = (run: WorkflowRun) => {
  return run.head_branch || 'N/A';
};

export default function WorkflowRunCard({
  run,
  isRunning = false,
  isSelected = false,
  onSelect,
}: WorkflowRunCardProps) {
  const workflowName = formatWorkflowName(run.name, run.path);
  const branchName = getBranchName(run);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 ${
        isSelected
          ? 'ring-2 ring-primary/20 border-primary bg-primary/5'
          : 'hover:bg-muted/50'
      } ${isRunning ? 'border-orange-200 bg-orange-50/50' : ''}`}
      onClick={() => onSelect(run)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {getStatusIcon(run.status, run.conclusion)}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground truncate">
                {workflowName}
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  #{run.id}
                </span>
                {isRunning && (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-200"
                  >
                    실행 중
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-xs bg-muted px-2 py-1 rounded mr-2">
                  {branchName}
                </span>
                {formatRelativeTime(run.created_at)}
                {' • '}
                {formatDuration(run.created_at, run.updated_at)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge(run.status, run.conclusion)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
