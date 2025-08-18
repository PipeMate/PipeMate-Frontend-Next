import { AreaNodeData } from '../area-editor/types';
import { WorkflowNodeData } from '../../types';
import { NodeType } from '../area-editor/types';

export interface ConfigField {
  key: string;
  value: string | object | string[];
  type: 'string' | 'object' | 'array';
  isExpanded?: boolean;
  children?: ConfigField[];
}

export interface SecretFormData {
  name: string;
  value: string;
  description?: string;
}

export interface SecretsData {
  availableSecrets: string[];
  missingSecrets: string[];
  loading: boolean;
  error: string | null;
  groupedSecrets?: any;
}

export interface FormData {
  showForm: boolean;
  secretsToCreate: SecretFormData[];
  showValues: Record<number, boolean>;
  isCreating: boolean;
}

export interface SecretsHandlers {
  onDeleteSecret: (secretName: string) => void;
  onCreateMissingSecrets: (secretNames: string[]) => void;
  onAddSecretForm: () => void;
  onRemoveSecretForm: (index: number) => void;
  onUpdateSecretForm: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onCloseSecretForm: () => void;
  onCreateSecrets: () => void;
}

export interface SecretFormProps {
  secrets: SecretFormData[];
  showValues: Record<number, boolean>;
  onAddSecret: () => void;
  onRemoveSecret: (index: number) => void;
  onUpdateSecret: (index: number, field: keyof SecretFormData, value: string) => void;
  onToggleValueVisibility: (index: number) => void;
  onClose: () => void;
  onCreateSecrets: () => void;
}

export interface SecretsTabProps {
  data: SecretsData;
  form: FormData;
  handlers: SecretsHandlers;
}

export interface NodeEditorProps {
  nodeData: WorkflowNodeData;
  nodeType: NodeType;
  onSave: (updatedData: WorkflowNodeData) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onMissingSecrets?: (missing: string[]) => void;
}

export interface IntegratedSidePanelProps {
  selectedNode: AreaNodeData | null;
  blocks: any[];
  isOpen: boolean;
  onSaveWorkflow: () => void;
  onClearWorkspace: () => void;
  onNodeSelect: (node: AreaNodeData) => void;
  onNodeEdit: (node: AreaNodeData) => void;
  onNodeDelete: (nodeId: string) => void;
  onBlockUpdate?: (updatedBlock: any) => void;
  hasNodes: boolean;
  updateNodeData?: (nodeId: string, data: WorkflowNodeData) => void;
  mode?: 'create' | 'edit';
  initialWorkflowName?: string;
  onWorkflowNameChange?: (name: string) => void;
}
