import React from "react";
import { Zap, Settings, Code } from "lucide-react";
import { AreaNodeData, AreaNodes } from "../types";
import { AreaNode } from "../../AreaNode";
import { getWorkspaceAreaColor } from "../../../constants/nodeConstants";

interface DropAreaProps {
  areaKey: keyof AreaNodes;
  title: string;
  nodes: AreaNodeData[];
  maxItems?: number;
  onNodeSelect: (node: AreaNodeData) => void;
  onNodeDragStart: (node: AreaNodeData) => void;
  onNodeDrag: (e: React.DragEvent, node: AreaNodeData) => void;
  onDragOver: (e: React.DragEvent, areaKey: string) => void;
  onDrop: (e: React.DragEvent, areaKey: keyof AreaNodes) => void;
  onDragLeave: (e: React.DragEvent, areaKey: string) => void;
  onJobDragOver: (e: React.DragEvent, jobId: string) => void;
  onJobStepDrop: (e: React.DragEvent, jobId: string) => void;
  onJobDragLeave: (e: React.DragEvent, jobId: string) => void;
  getDragOverStyle: (
    areaKey: string,
    isJobStep?: boolean,
    jobId?: string
  ) => string;
  getStepsByJob: () => Record<string, AreaNodeData[]>;
  renderEmptyState: (
    areaKey: keyof AreaNodes,
    title: string,
    isDragOver: boolean,
    isJobStep?: boolean,
    jobId?: string
  ) => React.ReactNode;
  dragOverArea: string | null;
  dragOverJobId: string | null;
}

/**
 * 드롭 영역 컴포넌트
 */
export const DropArea: React.FC<DropAreaProps> = ({
  areaKey,
  title,
  nodes,
  maxItems,
  onNodeSelect,
  onNodeDragStart,
  onNodeDrag,
  onDragOver,
  onDrop,
  onDragLeave,
  onJobDragOver,
  onJobStepDrop,
  onJobDragLeave,
  getDragOverStyle,
  getStepsByJob,
  renderEmptyState,
  dragOverArea,
  dragOverJobId,
}) => {
  const isFull = maxItems ? nodes.length >= maxItems : false;
  const color = getWorkspaceAreaColor(areaKey.toUpperCase() as any);

  /**
   * 영역 헤더 렌더링
   */
  const renderAreaHeader = (
    title: string,
    count: number,
    maxItems?: number,
    subtitle?: string
  ) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">
            {title}
            {subtitle && ` - ${subtitle}`}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              maxItems && count >= maxItems
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {count}
            {maxItems && `/${maxItems}`}
          </span>
        </div>
      </div>
    );
  };

  /**
   * 트리거 영역 헤더 렌더링 (컴팩트 버전)
   */
  const renderTriggerHeader = (
    title: string,
    count: number,
    maxItems?: number
  ) => {
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              maxItems && count >= maxItems
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {count}
            {maxItems && `/${maxItems}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`border-2 border-dashed ${color} rounded-xl transition-all duration-300 ease-in-out ${
        areaKey === "trigger" ? "p-4 h-fit" : "p-6 h-fit"
      } ${getDragOverStyle(areaKey)}`}
      onDragOver={(e) => onDragOver(e, areaKey)}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(e, areaKey);
      }}
      onDragLeave={(e) => onDragLeave(e, areaKey)}
    >
      {areaKey === "trigger"
        ? renderTriggerHeader(title, nodes.length, maxItems)
        : renderAreaHeader(title, nodes.length, maxItems)}
      <div
        className={
          areaKey === "job"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        }
      >
        {nodes.map((node, index) => (
          <div
            key={node.id}
            data-job-id={node.type === "job" ? node.id : undefined}
            onDragOver={(e) => onDragOver(e, areaKey)}
            onDrop={(e) => onDrop(e, areaKey)}
            onDragLeave={(e) => onDragLeave(e, areaKey)}
            className={areaKey === "job" ? "flex-shrink-0" : ""}
          >
            <AreaNode
              node={node}
              onSelect={onNodeSelect}
              onDragStart={onNodeDragStart}
              onDrag={onNodeDrag}
            />

            {/* Job 내부에 Step 영역 표시 */}
            {node.type === "job" && (
              <div className="mt-3 w-full">
                {renderAreaHeader(
                  "Steps",
                  getStepsByJob()[node.id]?.length || 0,
                  undefined,
                  node.data.jobName
                )}

                {/* Step 드롭 영역 - Job과 동일한 너비 */}
                <div
                  className={`border-2 border-dashed border-orange-300 bg-orange-50/30 rounded-xl p-4 transition-all duration-300 ease-in-out w-full ${getDragOverStyle(
                    areaKey,
                    true,
                    node.id
                  )}`}
                  onDragOver={(e) => onJobDragOver(e, node.id)}
                  onDrop={(e) => {
                    e.stopPropagation();
                    onJobStepDrop(e, node.id);
                  }}
                  onDragLeave={(e) => onJobDragLeave(e, node.id)}
                >
                  <div className="space-y-3 w-full">
                    {getStepsByJob()[node.id]?.map((step, stepIndex) => (
                      <div key={step.id} className="w-full">
                        <AreaNode
                          node={step}
                          onSelect={onNodeSelect}
                          onDragStart={onNodeDragStart}
                          onDrag={onNodeDrag}
                        />
                      </div>
                    ))}
                    {(!getStepsByJob()[node.id] ||
                      getStepsByJob()[node.id].length === 0) &&
                      renderEmptyState(
                        areaKey,
                        "Step",
                        dragOverJobId === node.id,
                        true,
                        node.id
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {nodes.length === 0 && (
          <div className={areaKey === "job" ? "col-span-full" : ""}>
            {renderEmptyState(areaKey, title, dragOverArea === areaKey)}
          </div>
        )}
      </div>
    </div>
  );
};
