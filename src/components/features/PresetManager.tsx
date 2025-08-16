'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IconBadge } from '@/components/ui';
import { getDomainColor } from '@/app/github-actions-flow/constants/nodeConstants';

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
      id: '1',
      name: '기본 CI/CD 파이프라인',
      description: 'Node.js 프로젝트를 위한 기본 CI/CD 설정',
      domain: 'nodejs',
      task: ['ci', 'cd'],
      isActive: true,
      config: {
        nodeVersion: '18',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
      },
    },
    {
      id: '2',
      name: 'Python 프로젝트 파이프라인',
      description: 'Python 프로젝트를 위한 기본 설정',
      domain: 'python',
      task: ['ci', 'test'],
      isActive: true,
      config: {
        pythonVersion: '3.11',
        installCommand: 'pip install -r requirements.txt',
        testCommand: 'pytest',
      },
    },
    {
      id: '3',
      name: 'Docker 빌드 파이프라인',
      description: 'Docker 이미지 빌드 및 푸시',
      domain: 'docker',
      task: ['build', 'push'],
      isActive: false,
      config: {
        dockerfile: 'Dockerfile',
        imageName: 'myapp',
        registry: 'docker.io',
      },
    },
  ]);

  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  const handlePresetToggle = (presetId: string) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === presetId ? { ...preset, isActive: !preset.isActive } : preset,
      ),
    );
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
  };

  const handleApplyPreset = async (preset: Preset) => {
    // * 실제로는 백엔드 API를 호출하여 프리셋을 적용
    console.log('프리셋 적용:', preset);
    alert(`${preset.name} 프리셋이 적용되었습니다.`);
  };

  const domains = Array.from(new Set(presets.map((p) => p.domain).filter(Boolean)));

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
            <CardTitle>프리셋 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPreset?.id === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{preset.name}</h3>
                        <Badge
                          variant={preset.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {preset.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{preset.description}</p>

                      {preset.domain && (
                        <div className="flex items-center gap-2 mb-2">
                          <IconBadge
                            icon={
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    (getDomainColor(preset.domain) as any)?.bg ||
                                    '#6b7280',
                                }}
                              />
                            }
                            variant="outline"
                            size="sm"
                          >
                            {preset.domain}
                          </IconBadge>
                        </div>
                      )}

                      {preset.task && preset.task.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {preset.task.map((task) => (
                            <Badge key={task} variant="outline" className="text-xs">
                              {task}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePresetToggle(preset.id);
                      }}
                    >
                      {preset.isActive ? '비활성화' : '활성화'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 선택된 프리셋 상세 정보 */}
        {selectedPreset && (
          <Card>
            <CardHeader>
              <CardTitle>프리셋 상세 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedPreset.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPreset.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">상태:</span>
                    <div className="mt-1">
                      <Badge
                        variant={selectedPreset.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {selectedPreset.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </div>

                  {selectedPreset.domain && (
                    <div>
                      <span className="font-medium text-gray-700">도메인:</span>
                      <div className="mt-1">
                        <IconBadge
                          icon={
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  (getDomainColor(selectedPreset.domain) as any)?.bg ||
                                  '#6b7280',
                              }}
                            />
                          }
                          variant="outline"
                          size="sm"
                        >
                          {selectedPreset.domain}
                        </IconBadge>
                      </div>
                    </div>
                  )}
                </div>

                {selectedPreset.task && selectedPreset.task.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <span className="font-medium text-gray-700">작업:</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedPreset.task.map((task) => (
                          <Badge key={task} variant="outline" className="text-xs">
                            {task}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">설정</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(selectedPreset.config, null, 2)}
                    </pre>
                  </div>
                </div>

                <Button
                  onClick={() => handleApplyPreset(selectedPreset)}
                  className="w-full"
                  disabled={!selectedPreset.isActive}
                >
                  프리셋 적용
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
