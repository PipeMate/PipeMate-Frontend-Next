"use client";

import React, { useState, useEffect } from "react";
import { WorkflowNodeData } from "../types";
import { NodeType } from "./AreaBasedWorkflowEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  X,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";

interface NodeEditorProps {
  nodeData: WorkflowNodeData;
  nodeType: NodeType;
  onSave: (updatedData: WorkflowNodeData) => void;
  onCancel: () => void;
}

interface ConfigField {
  key: string;
  value: string | object | string[];
  type: "string" | "object" | "array";
  isExpanded?: boolean;
  children?: ConfigField[];
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeData,
  nodeType,
  onSave,
  onCancel,
}) => {
  const [editedData, setEditedData] = useState<WorkflowNodeData>(nodeData);
  const [configText, setConfigText] = useState<string>("");
  const [configError, setConfigError] = useState<string>("");
  const [showConfigPreview, setShowConfigPreview] = useState(false);
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  const [activeTab] = useState("fields");

  // 초기 데이터 설정
  useEffect(() => {
    setEditedData(nodeData);
    setConfigText(JSON.stringify(nodeData.config, null, 2));
    setConfigError("");
    const fields = parseConfigFields(nodeData.config);
    setConfigFields(fields);
  }, [nodeData]);

  // config 필드 파싱 (재귀적으로 중첩 객체 처리)
  const parseConfigFields = (
    config: Record<string, unknown>,
    parentKey = ""
  ): ConfigField[] => {
    const fields: ConfigField[] = [];

    Object.entries(config).forEach(([key, value]) => {
      let type: "string" | "object" | "array" = "string";
      let children: ConfigField[] | undefined;

      if (Array.isArray(value)) {
        type = "array";
      } else if (value && typeof value === "object") {
        type = "object";
        // 중첩된 객체의 경우 재귀적으로 파싱
        children = parseConfigFields(value as Record<string, unknown>, key);
      }

      fields.push({
        key,
        value: value as string | object | string[],
        type,
        isExpanded: false,
        children,
      });
    });

    return fields;
  };

  // 타입별 고정 라벨 정의
  const getFixedLabels = (type: NodeType) => {
    switch (type) {
      case "workflowTrigger":
        return {
          name: "워크플로우 기본 설정",
          description:
            "GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.",
        };
      case "job":
        return {
          name: "Job 설정",
          description: "사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.",
        };
      case "step":
        return {
          name: "Step 설정",
          description: "워크플로우 실행 단계를 설정하는 블록입니다.",
        };
      default:
        return { name: "", description: "" };
    }
  };

  // 타입별 편집 가능한 필드 정의
  const getEditableFields = (type: NodeType) => {
    switch (type) {
      case "workflowTrigger":
        return ["label"];
      case "job":
        return ["label", "jobName"];
      case "step":
        return ["label", "jobName", "domain", "task"];
      default:
        return [];
    }
  };

  // config 유효성 검사
  const validateConfig = (configStr: string): boolean => {
    try {
      JSON.parse(configStr);
      setConfigError("");
      return true;
    } catch (error) {
      setConfigError("유효하지 않은 JSON 형식입니다.");
      return false;
    }
  };

  // 중첩된 필드 값 변경
  const handleConfigFieldChange = (
    index: number,
    value: string | object | string[],
    parentIndex?: number
  ) => {
    const newFields = [...configFields];

    if (parentIndex !== undefined) {
      // 중첩된 필드인 경우
      const parent = newFields[parentIndex];
      if (parent.children) {
        parent.children[index].value = value;
        // 부모 객체 업데이트
        const parentValue: Record<string, unknown> = {};
        parent.children.forEach((child) => {
          parentValue[child.key] = child.value;
        });
        parent.value = parentValue;
      }
    } else {
      // 최상위 필드인 경우
      newFields[index].value = value;
    }

    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 필드에서 config 업데이트
  const updateConfigFromFields = (fields: ConfigField[]) => {
    const newConfig: Record<string, unknown> = {};

    fields.forEach((field) => {
      if (field.type === "object" && field.children) {
        // 중첩된 객체의 경우
        const nestedConfig: Record<string, unknown> = {};
        field.children.forEach((child) => {
          nestedConfig[child.key] = child.value;
        });
        newConfig[field.key] = nestedConfig;
      } else {
        newConfig[field.key] = field.value;
      }
    });

    setEditedData((prev) => ({
      ...prev,
      config: newConfig,
    }));

    // JSON 텍스트도 업데이트
    setConfigText(JSON.stringify(newConfig, null, 2));
  };

  // 중첩된 필드 추가
  const handleAddNestedField = (parentIndex: number) => {
    const newFields = [...configFields];
    const parent = newFields[parentIndex];

    if (parent.children) {
      const newChild: ConfigField = {
        key: `field_${parent.children.length + 1}`,
        value: "",
        type: "string",
      };
      parent.children.push(newChild);
      setConfigFields(newFields);
      updateConfigFromFields(newFields);
    }
  };

  // 중첩된 필드 삭제
  const handleRemoveNestedField = (parentIndex: number, childIndex: number) => {
    const newFields = [...configFields];
    const parent = newFields[parentIndex];

    if (parent.children) {
      parent.children.splice(childIndex, 1);
      setConfigFields(newFields);
      updateConfigFromFields(newFields);
    }
  };

  // 필드 확장/축소 토글
  const toggleFieldExpansion = (index: number) => {
    const newFields = [...configFields];
    newFields[index].isExpanded = !newFields[index].isExpanded;
    setConfigFields(newFields);
  };

  // 동적 필드 추가
  const handleAddConfigField = () => {
    const newField: ConfigField = {
      key: `field_${configFields.length + 1}`,
      value: "",
      type: "string",
    };
    const newFields = [...configFields, newField];
    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 동적 필드 삭제
  const handleRemoveConfigField = (index: number) => {
    const newFields = configFields.filter((_, i) => i !== index);
    setConfigFields(newFields);
    updateConfigFromFields(newFields);
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!validateConfig(configText)) {
      return;
    }

    try {
      const config = JSON.parse(configText);
      const updatedData: WorkflowNodeData = {
        ...editedData,
        config,
      };
      onSave(updatedData);
    } catch (error) {
      setConfigError("설정 저장 중 오류가 발생했습니다.");
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    onCancel();
  };

  // 필드 값 렌더링
  const renderFieldValue = (
    field: ConfigField,
    index: number,
    parentIndex?: number
  ) => {
    switch (field.type) {
      case "string":
        return (
          <Input
            value={String(field.value)}
            onChange={(e) =>
              handleConfigFieldChange(index, e.target.value, parentIndex)
            }
            placeholder="값을 입력하세요"
            className="mt-1"
          />
        );
      case "object":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFieldExpansion(index)}
                className="p-1"
              >
                {field.isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
              <span className="text-xs text-gray-500">
                객체 (클릭하여 확장)
              </span>
            </div>
            {field.isExpanded && field.children && (
              <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                {field.children.map((child, childIndex) => (
                  <div key={childIndex} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={child.key}
                          onChange={(e) => {
                            const newFields = [...configFields];
                            if (newFields[index].children) {
                              newFields[index].children![childIndex].key =
                                e.target.value;
                              setConfigFields(newFields);
                              updateConfigFromFields(newFields);
                            }
                          }}
                          className="w-32 text-sm"
                          placeholder="필드명"
                        />
                        <Badge variant="outline" className="text-xs">
                          {child.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoveNestedField(index, childIndex)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus size={14} />
                      </Button>
                    </div>
                    {renderFieldValue(child, childIndex, index)}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNestedField(index)}
                  className="w-full"
                >
                  <Plus size={14} className="mr-1" />
                  필드 추가
                </Button>
              </div>
            )}
          </div>
        );
      case "array":
        return (
          <Input
            value={
              Array.isArray(field.value)
                ? field.value.join(", ")
                : String(field.value)
            }
            onChange={(e) => {
              const values = e.target.value.split(",").map((v) => v.trim());
              handleConfigFieldChange(index, values, parentIndex);
            }}
            placeholder="쉼표로 구분하여 입력하세요"
            className="mt-1"
          />
        );
      default:
        return (
          <Input
            value={String(field.value)}
            onChange={(e) =>
              handleConfigFieldChange(index, e.target.value, parentIndex)
            }
            placeholder="값을 입력하세요"
            className="mt-1"
          />
        );
    }
  };

  const fixedLabels = getFixedLabels(nodeType);
  const editableFields = getEditableFields(nodeType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {nodeType === "workflowTrigger" ? "Trigger" : nodeType}
            </Badge>
            <h2 className="text-lg font-semibold">노드 편집</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X size={16} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 고정 필드 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">고정 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">
                  이름
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {fixedLabels.name}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  설명
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {fixedLabels.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 편집 가능한 필드 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">편집 가능한 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 라벨 */}
              {editableFields.includes("label") && (
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    표시 이름
                  </label>
                  <Input
                    value={editedData.label}
                    onChange={(e) =>
                      setEditedData({ ...editedData, label: e.target.value })
                    }
                    placeholder="노드 표시 이름을 입력하세요"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Job 이름 */}
              {editableFields.includes("jobName") && (
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Job 이름
                  </label>
                  <Input
                    value={editedData.jobName || ""}
                    onChange={(e) =>
                      setEditedData({ ...editedData, jobName: e.target.value })
                    }
                    placeholder="job-name을 입력하세요"
                    className="mt-1"
                  />
                </div>
              )}

              {/* 도메인 */}
              {editableFields.includes("domain") && (
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    도메인
                  </label>
                  <Input
                    value={editedData.domain || ""}
                    onChange={(e) =>
                      setEditedData({ ...editedData, domain: e.target.value })
                    }
                    placeholder="도메인을 입력하세요 (예: github, java, docker)"
                    className="mt-1"
                  />
                </div>
              )}

              {/* 태스크 */}
              {editableFields.includes("task") && (
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    태스크 (쉼표로 구분)
                  </label>
                  <Input
                    value={editedData.task?.join(", ") || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        task: e.target.value.split(",").map((t) => t.trim()),
                      })
                    }
                    placeholder="태스크를 쉼표로 구분하여 입력하세요 (예: checkout, build)"
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Config 편집 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">설정 (Config)</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={activeTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fields">동적 필드 편집</TabsTrigger>
                  <TabsTrigger value="json">JSON 편집</TabsTrigger>
                </TabsList>

                <TabsContent value="fields" className="space-y-4">
                  <div className="space-y-3">
                    {configFields.map((field, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={field.key}
                              onChange={(e) => {
                                const newFields = [...configFields];
                                newFields[index].key = e.target.value;
                                setConfigFields(newFields);
                                updateConfigFromFields(newFields);
                              }}
                              className="w-32 text-sm"
                              placeholder="필드명"
                            />
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveConfigField(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                        {renderFieldValue(field, index)}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={handleAddConfigField}
                      className="w-full"
                    >
                      + 필드 추가
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="json">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        JSON 형식으로 직접 편집
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfigPreview(!showConfigPreview)}
                      >
                        <Eye size={14} />
                        {showConfigPreview ? "편집" : "미리보기"}
                      </Button>
                    </div>
                    {showConfigPreview ? (
                      <div className="p-3 bg-gray-50 rounded border">
                        <pre className="text-xs overflow-auto max-h-64">
                          {JSON.stringify(editedData.config, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={configText}
                          onChange={(e) => {
                            setConfigText(e.target.value);
                            validateConfig(e.target.value);
                          }}
                          className="w-full h-64 p-3 border rounded font-mono text-xs"
                          placeholder="JSON 형식으로 설정을 입력하세요"
                        />
                        {configError && (
                          <div className="mt-2 text-xs text-red-500">
                            {configError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!!configError}>
            <Save size={16} className="mr-2" />
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};
