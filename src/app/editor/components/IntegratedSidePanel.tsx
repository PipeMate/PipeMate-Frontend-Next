'use client';

import React, { useState, useEffect } from 'react';
import { useRepository } from '@/contexts/RepositoryContext';
import { useSecrets } from '@/api';
import { toast } from 'react-toastify';
import { Blocks, Edit, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaNodeData } from './area-editor/types';
import { ServerBlock } from '../types';
import { WorkflowNodeData } from '../types';
import { LibraryTab, EditorTab, YamlTab, SecretCreateDialog } from './side-panel';
import {
  detectSecretsInConfig,
  canNodeUseSecrets,
  findMissingSecrets,
} from '../utils/secretsDetector';

//* ========================================
//* Props 타입 정의
//* ========================================

interface IntegratedSidePanelProps {
  selectedNode: AreaNodeData | null;
  blocks: ServerBlock[];
  isOpen: boolean;
  onNodeEdit: (node: AreaNodeData) => void;
  onNodeDelete: (nodeId: string) => void;
  updateNodeData?: (nodeId: string, data: WorkflowNodeData) => void;
  mode?: 'create' | 'edit';
  initialWorkflowName?: string;
  onWorkflowNameChange?: (name: string) => void;
}

//* ========================================
//* 통합 사이드 패널 컴포넌트
//* ========================================

export const IntegratedSidePanel: React.FC<IntegratedSidePanelProps> = ({
  selectedNode,
  blocks,
  isOpen,
  onNodeEdit,
  onNodeDelete,
  updateNodeData,
}) => {
  const { owner, repo } = useRepository();

  // Secrets API 훅
  const { data: secretsData } = useSecrets(owner || '', repo || '');

  // 상태 관리
  const [activeTab, setActiveTab] = useState<'library' | 'editor' | 'yaml'>('library');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNode, setEditingNode] = useState<AreaNodeData | null>(null);
  const [yamlViewMode, setYamlViewMode] = useState<'block' | 'full'>('block');

  // 시크릿 관련 상태
  const [showSecretForm, setShowSecretForm] = useState(false);
  const [secretsToCreate, setSecretsToCreate] = useState<
    { name: string; value: string }[]
  >([]);

  // 노드 선택 시 편집 탭으로 자동 전환 및 편집 모드 시작
  useEffect(() => {
    if (selectedNode) {
      setActiveTab('editor');
      setEditingNode(selectedNode);
      setIsEditing(true);
    }
  }, [selectedNode]);

  // 노드 편집 완료 - 시크릿 검사 후 저장
  const handleSaveNode = (updatedData: WorkflowNodeData) => {
    if (editingNode && updateNodeData) {
      // 시크릿 검사
      if (canNodeUseSecrets(editingNode.type) && updatedData.config) {
        const requiredSecrets = detectSecretsInConfig(updatedData.config);
        const userSecrets: string[] = [];

        if (secretsData?.data?.groupedSecrets) {
          Object.values(secretsData.data.groupedSecrets).forEach((group: any) => {
            if (Array.isArray(group)) {
              group.forEach((secret: any) => {
                if (secret.name) userSecrets.push(secret.name);
              });
            }
          });
        }

        const missingSecrets = findMissingSecrets(requiredSecrets, userSecrets);

        if (missingSecrets.length > 0) {
          // 누락된 시크릿이 있으면 시크릿 생성 다이얼로그 표시
          const newSecrets = missingSecrets.map((name) => ({
            name,
            value: '',
          }));
          setSecretsToCreate(newSecrets);
          setShowSecretForm(true);
          return; // 시크릿 생성 후에 저장하도록 중단
        }
      }

      // 시크릿이 없거나 모든 시크릿이 존재하면 바로 저장
      updateNodeData(editingNode.id, updatedData);
      onNodeEdit({
        ...editingNode,
        data: updatedData,
      });
      toast.success('노드가 저장되었습니다.');
      setIsEditing(false);
      setEditingNode(null);
    }
  };

  // 노드 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNode(null);
  };

  // 시크릿 관련 핸들러들
  const handleCreateMissingSecrets = (secretNames: string[]) => {
    if (secretNames.length > 0) {
      const newSecrets = secretNames.map((name) => ({
        name,
        value: '',
      }));
      setSecretsToCreate(newSecrets);
      setShowSecretForm(true);
    } else {
      setSecretsToCreate([{ name: '', value: '' }]);
      setShowSecretForm(true);
    }
  };

  const handleCloseSecretForm = () => {
    setShowSecretForm(false);
    setSecretsToCreate([]);

    // 시크릿 생성 취소 시에도 노드 저장 진행
    if (editingNode && updateNodeData) {
      const updatedData = editingNode.data;
      updateNodeData(editingNode.id, updatedData);
      onNodeEdit({
        ...editingNode,
        data: updatedData,
      });
      toast.success('노드가 저장되었습니다.');
      setIsEditing(false);
      setEditingNode(null);
    }
  };

  const handleCreateSecrets = async () => {
    // 시크릿 생성 후 자동으로 노드 저장 진행
    if (editingNode && updateNodeData) {
      // 시크릿 생성 후 노드 저장
      const updatedData = editingNode.data;
      updateNodeData(editingNode.id, updatedData);
      onNodeEdit({
        ...editingNode,
        data: updatedData,
      });
      toast.success('노드가 저장되었습니다.');
      setIsEditing(false);
      setEditingNode(null);
      setShowSecretForm(false);
      setSecretsToCreate([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 flex-shrink-0 p-2">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as any);
            // 편집 탭 클릭 시 선택된 노드가 있으면 바로 편집 모드로 전환
            if (value === 'editor' && selectedNode && !isEditing) {
              setEditingNode(selectedNode);
              setIsEditing(true);
            }
          }}
          defaultValue="library"
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Blocks className="h-4 w-4" />
              <span>라이브러리</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>편집</span>
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>YAML</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          defaultValue="library"
          className="w-full h-full flex flex-col"
        >
          {/* 블록 라이브러리 탭 */}
          <TabsContent value="library" className="h-full mt-0 flex-1 min-h-0">
            <LibraryTab />
          </TabsContent>

          {/* 편집 탭 */}
          <TabsContent value="editor" className="h-full mt-0 flex-1 min-h-0">
            <EditorTab
              selectedNode={selectedNode}
              onSave={handleSaveNode}
              onCancel={handleCancelEdit}
              onDelete={onNodeDelete}
              onMissingSecrets={handleCreateMissingSecrets}
            />
          </TabsContent>

          {/* YAML 탭 */}
          <TabsContent value="yaml" className="h-full mt-0 flex-1 min-h-0">
            <YamlTab
              selectedNode={selectedNode}
              blocks={blocks}
              yamlViewMode={yamlViewMode}
              onYamlViewModeChange={setYamlViewMode}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 시크릿 생성 다이얼로그 */}
      <SecretCreateDialog
        isOpen={showSecretForm}
        onClose={handleCloseSecretForm}
        missingSecrets={secretsToCreate.map((s) => s.name).filter(Boolean)}
        onSecretsCreated={handleCreateSecrets}
      />
    </div>
  );
};
