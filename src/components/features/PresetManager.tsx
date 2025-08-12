"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDomainColor } from "@/app/github-actions-flow/constants/nodeConstants";

interface Preset {
  id: string;
  name: string;
  description: string;
  domain?: string;
  task?: string[];
  isActive: boolean;
  config: Record<string, unknown>;
}

export default function PresetManager() {
  const [presets, setPresets] = useState<Preset[]>([
    {
      id: "1",
      name: "기본 CI/CD 파이프라인",
      description: "Node.js 프로젝트를 위한 기본 CI/CD 설정",
      domain: "nodejs",
      task: ["ci", "cd"],
      isActive: true,
      config: {
        nodeVersion: "18",
        buildCommand: "npm run build",
        testCommand: "npm test",
      },
    },
    {
      id: "2",
      name: "Python 프로젝트 파이프라인",
      description: "Python 프로젝트를 위한 기본 설정",
      domain: "python",
      task: ["ci", "test"],
      isActive: true,
      config: {
        pythonVersion: "3.11",
        installCommand: "pip install -r requirements.txt",
        testCommand: "pytest",
      },
    },
    {
      id: "3",
      name: "Docker 빌드 파이프라인",
      description: "Docker 이미지 빌드 및 푸시",
      domain: "docker",
      task: ["build", "push"],
      isActive: false,
      config: {
        dockerfile: "Dockerfile",
        imageName: "myapp",
        registry: "docker.io",
      },
    },
  ]);

  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  const handlePresetToggle = (presetId: string) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === presetId
          ? { ...preset, isActive: !preset.isActive }
          : preset
      )
    );
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
  };

  const handleApplyPreset = async (preset: Preset) => {
    // * 실제로는 백엔드 API를 호출하여 프리셋을 적용
    console.log("프리셋 적용:", preset);
    alert(`${preset.name} 프리셋이 적용되었습니다.`);
  };

  const domains = Array.from(
    new Set(presets.map((p) => p.domain).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">프리셋 관리</h2>
        <div className="text-sm text-gray-600">
          서버 시작 시 자동으로 적용될 프리셋을 관리합니다.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프리셋 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>사용 가능한 프리셋</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain}>
                  <h3 className="font-medium text-gray-700 mb-2">{domain}</h3>
                  <div className="space-y-2">
                    {presets
                      .filter((preset) => preset.domain === domain)
                      .map((preset) => {
                        const colors = preset.domain
                          ? getDomainColor(preset.domain)
                          : null;
                        return (
                          <div
                            key={preset.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPreset?.id === preset.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => handlePresetSelect(preset)}
                            style={
                              colors
                                ? {
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4
                                  className="font-medium"
                                  style={
                                    colors ? { color: colors.text } : undefined
                                  }
                                >
                                  {preset.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {preset.description}
                                </p>
                                {preset.task && preset.task.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {preset.task.map((task, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                        style={
                                          colors
                                            ? {
                                                borderColor: colors.border,
                                                color: colors.text,
                                              }
                                            : undefined
                                        }
                                      >
                                        {task}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    preset.isActive ? "default" : "secondary"
                                  }
                                >
                                  {preset.isActive ? "활성" : "비활성"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePresetToggle(preset.id);
                                  }}
                                >
                                  {preset.isActive ? "비활성화" : "활성화"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 선택된 프리셋 상세 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPreset
                ? `${selectedPreset.name} 상세 정보`
                : "프리셋 선택"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPreset ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">설명</h4>
                  <p className="text-gray-600">{selectedPreset.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">도메인</h4>
                  <Badge variant="outline">
                    {selectedPreset.domain || "N/A"}
                  </Badge>
                </div>

                {selectedPreset.task && selectedPreset.task.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">태스크</h4>
                    <div className="flex gap-1 flex-wrap">
                      {selectedPreset.task.map((task, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {task}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">상태</h4>
                  <Badge
                    variant={selectedPreset.isActive ? "default" : "secondary"}
                  >
                    {selectedPreset.isActive ? "활성화됨" : "비활성화됨"}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">설정</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-40">
                    {JSON.stringify(selectedPreset.config, null, 2)}
                  </pre>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApplyPreset(selectedPreset)}
                    className="flex-1"
                  >
                    프리셋 적용
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePresetToggle(selectedPreset.id)}
                  >
                    {selectedPreset.isActive ? "비활성화" : "활성화"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                왼쪽에서 프리셋을 선택하세요
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 활성화된 프리셋 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>활성화된 프리셋 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presets
              .filter((preset) => preset.isActive)
              .map((preset) => {
                const colors = preset.domain
                  ? getDomainColor(preset.domain)
                  : null;
                return (
                  <div
                    key={preset.id}
                    className="p-3 border rounded-lg"
                    style={
                      colors
                        ? {
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className="font-medium"
                        style={colors ? { color: colors.text } : undefined}
                      >
                        {preset.name}
                      </h4>
                      <Badge variant="default">활성</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {preset.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      도메인: {preset.domain || "N/A"}
                    </p>
                    {preset.task && preset.task.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        태스크: {preset.task.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
          {presets.filter((p) => p.isActive).length === 0 && (
            <div className="text-center text-gray-500 py-4">
              활성화된 프리셋이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
