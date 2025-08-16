import { Card, CardContent } from '@/components/ui/card';
import { getStatusIcon, getStatusBadge } from './Status';
import { formatDuration, formatRelativeTime } from '../utils';
import type { WorkflowRun } from '../types';

interface WorkflowRunCardProps {
  run: WorkflowRun;
  isRunning?: boolean;
  isSelected?: boolean;
  onSelect: (run: WorkflowRun) => void;
}

// 실행 번호 안전하게 가져오기
const getRunNumber = (run: WorkflowRun) => {
  return (
    run.run_number ||
    (run as { run_number?: number }).run_number ||
    (run as { number?: number }).number ||
    'N/A'
  );
};

export default function WorkflowRunCard({
  run,
  isRunning = false,
  isSelected = false,
  onSelect,
}: WorkflowRunCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${isRunning ? 'border-orange-200 bg-orange-50' : ''}`}
      onClick={() => onSelect(run)}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {getStatusIcon(run.status, run.conclusion)}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {run.name} #{getRunNumber(run)}
                {isRunning && (
                  <span className="ml-2 text-sm text-orange-600 font-medium">
                    실행 중
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
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
