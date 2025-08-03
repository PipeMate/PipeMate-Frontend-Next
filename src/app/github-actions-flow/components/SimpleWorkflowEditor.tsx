"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ServerBlock } from "@/app/github-actions-flow/types";
import { convertServerBlocksToNodes } from "@/app/github-actions-flow/utils/dataConverter";

interface WorkflowNode {
  id: string;
  type: "trigger" | "job" | "step";
  label: string;
  position: { x: number; y: number };
  data: any;
  connections: string[]; //* 연결된 노드 ID들
}

interface Connection {
  id: string;
  source: string;
  target: string;
}

interface SimpleWorkflowEditorProps {
  onWorkflowChange?: (workflow: any) => void;
  initialBlocks?: ServerBlock[];
  onNodeSelect?: (block: ServerBlock) => void;
  onEditModeToggle?: () => void;
  isEditing?: boolean;
}

export const SimpleWorkflowEditor: React.FC<SimpleWorkflowEditorProps> = ({
  onWorkflowChange,
  initialBlocks,
  onNodeSelect,
  onEditModeToggle,
  isEditing,
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  //* 초기 노드 설정
  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      const { nodes: initialNodes } = convertServerBlocksToNodes(initialBlocks);
      const workflowNodes: WorkflowNode[] = initialNodes.map((node, index) => ({
        id: node.id,
        type:
          node.type === "workflowTrigger"
            ? "trigger"
            : (node.type as "trigger" | "job" | "step"),
        label: (node.data as any).label || "Node",
        position: { x: 50 + index * 250, y: 50 + (index % 3) * 150 },
        data: node.data,
        connections: [],
      }));
      setNodes(workflowNodes);
    }
  }, [initialBlocks]);

  //* 고유 ID 생성
  const generateId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  //* 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    setDraggedNode(nodeId);
    e.dataTransfer.setData("text/plain", nodeId);
  }, []);

  //* 드래그 오버
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  //* 드롭 처리
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const nodeId = e.dataTransfer.getData("text/plain");
    if (!nodeId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, position: { x, y } } : node
      )
    );

    setDraggedNode(null);
  }, []);

  //* 노드 추가
  const addNode = useCallback((block: ServerBlock) => {
    const newNode: WorkflowNode = {
      id: generateId(block.type),
      type: block.type as "trigger" | "job" | "step",
      label: block.name,
      position: { x: 50, y: 50 },
      data: block,
      connections: [],
    };

    setNodes((prev) => [...prev, newNode]);
  }, []);

  //* 노드 삭제
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setConnections((prev) =>
      prev.filter((conn) => conn.source !== nodeId && conn.target !== nodeId)
    );
  }, []);

  //* 연결 생성
  const createConnection = useCallback((sourceId: string, targetId: string) => {
    const newConnection: Connection = {
      id: generateId("connection"),
      source: sourceId,
      target: targetId,
    };
    setConnections((prev) => [...prev, newConnection]);
  }, []);

  //* 연결선 그리기
  const drawConnections = useCallback(() => {
    return connections.map((connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return null;

      const sourceX = sourceNode.position.x + 110; //* 노드 중앙
      const sourceY = sourceNode.position.y + 40;
      const targetX = targetNode.position.x + 110;
      const targetY = targetNode.position.y + 40;

      return (
        <svg
          key={connection.id}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <line
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
        </svg>
      );
    });
  }, [connections, nodes]);

  //* 노드 렌더링
  const renderNode = useCallback(
    (node: WorkflowNode) => {
      const nodeColors = {
        trigger: "bg-blue-500",
        job: "bg-green-500",
        step: "bg-orange-500",
      };

      return (
        <div
          key={node.id}
          className={`absolute w-56 h-20 rounded-lg shadow-lg cursor-move ${
            nodeColors[node.type]
          } text-white p-3`}
          style={{
            left: node.position.x,
            top: node.position.y,
            zIndex: 2,
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onClick={() => setSelectedNode(node)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{node.label}</div>
              <div className="text-xs opacity-80 capitalize">{node.type}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="text-white hover:text-red-200 text-xs"
            >
              ×
            </button>
          </div>
        </div>
      );
    },
    [handleDragStart, deleteNode]
  );

  return (
    <div className="w-full h-full relative bg-gray-50">
      {/* 워크플로우 에디터 컨테이너 */}
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 연결선 */}
        {drawConnections()}

        {/* 노드들 */}
        {nodes.map(renderNode)}

        {/* 드롭 영역 안내 */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <div>워크플로우를 시작하려면 노드를 드래그하세요</div>
            </div>
          </div>
        )}
      </div>

      {/* 선택된 노드 정보 */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
          <h3 className="font-semibold mb-2">{selectedNode.label}</h3>
          <p className="text-sm text-gray-600 mb-2">
            타입: {selectedNode.type}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1 bg-gray-200 rounded text-sm"
            >
              닫기
            </button>
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
