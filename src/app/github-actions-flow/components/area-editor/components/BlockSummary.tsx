import React from "react";
import { Play, GitBranch, Settings } from "lucide-react";
import { NodeType } from "../types";
import { AreaNodeData } from "../types/areaNode";
import {
  parseTriggerConfig,
  parseJobConfig,
  parseStepConfig,
} from "../utils/configParser";

interface BlockSummaryProps {
  node: AreaNodeData;
}

export const BlockSummary: React.FC<BlockSummaryProps> = ({ node }) => {
  if (!node.data.config) return null;

  switch (node.type) {
    case "workflowTrigger":
      const triggerInfo = parseTriggerConfig(node.data.config);
      return (
        <div className="space-y-1">
          {/* 트리거 타입들 - 핵심 정보 */}
          {triggerInfo.triggers.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white/40">
              <Play size={12} />
              <span>{triggerInfo.triggers.join(", ")}</span>
            </div>
          )}

          {/* 브랜치 정보 - 핵심 정보 */}
          {triggerInfo.branches.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-80">
              <GitBranch size={12} />
              <span>{triggerInfo.branches.join(", ")}</span>
            </div>
          )}
        </div>
      );

    case "job":
      const jobInfo = parseJobConfig(node.data.config);
      return (
        <div className="space-y-1">
          {/* 실행 환경 - 핵심 정보 */}
          {jobInfo.runsOn.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white/40">
              <Settings size={12} />
              <span>{jobInfo.runsOn.join(", ")}</span>
            </div>
          )}

          {/* 의존성 - 핵심 정보 */}
          {jobInfo.needs.length > 0 && (
            <div className="flex items-center gap-1 text-xs opacity-80">
              <span>{jobInfo.needs.join(", ")}</span>
            </div>
          )}
        </div>
      );

    case "step":
      const stepInfo = parseStepConfig(node.data.config);
      return (
        <div className="space-y-1">
          {/* 도메인/태스크 정보 - 핵심 정보 */}
          {(node.data.domain || node.data.task) && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white/40">
              {node.data.domain && <span>{node.data.domain}</span>}
              {node.data.task && node.data.task.length > 0 && (
                <>
                  {node.data.domain && <span>•</span>}
                  <span>{node.data.task.join(", ")}</span>
                </>
              )}
            </div>
          )}

          {/* Action 또는 명령어 - 핵심 정보 */}
          {stepInfo.uses.length > 0 && (
            <div className="text-xs opacity-80">
              <span className="truncate max-w-[200px]">
                {stepInfo.uses.join(", ")}
              </span>
            </div>
          )}

          {stepInfo.run.length > 0 && (
            <div className="text-xs opacity-80">
              <span className="truncate max-w-[200px]">
                {stepInfo.run.join(", ")}
              </span>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};
