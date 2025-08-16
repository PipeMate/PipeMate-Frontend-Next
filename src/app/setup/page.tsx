'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Github, GitBranch } from 'lucide-react';

// * 커스텀 훅 import
import { useGithubSettings } from '@/hooks/useGithubSettings';

// * 탭 컴포넌트들
import { TokenTab } from '@/components/features/github-settings/TokenTab';
import { RepositoryTab } from '@/components/features/github-settings/RepositoryTab';

export default function SetupPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('token');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // * GitHub 설정 커스텀 훅 사용
  const {
    token,
    savedToken,
    tokenError,
    owner,
    repo,
    savedOwner,
    savedRepo,
    repoError,
    hasToken,
    hasRepository,
    isSetupComplete,
    setToken,
    setOwner,
    setRepo,
    handleSaveToken,
    handleDeleteToken,
    handleSaveRepository,
    handleDeleteRepository,
  } = useGithubSettings();

  // * 초기 로딩 완료 처리
  useEffect(() => {
    setIsChecking(false);
  }, []);

  // * 설정 완료 시 자동 리다이렉트
  useEffect(() => {
    if (isSetupComplete && !isChecking && !isRedirecting) {
      setIsRedirecting(true);
      setTimeout(() => {
        router.push('/workflows');
      }, 1000);
    }
  }, [isSetupComplete, isChecking, isRedirecting, router]);

  // * 설정 단계 계산
  const totalSteps = 2;
  const completedSteps = [hasToken, hasRepository].filter(Boolean).length;

  // * 설정 단계 정의
  const steps = [
    {
      id: 'token',
      title: 'GitHub 토큰 설정',
      description: 'GitHub API에 접근하기 위한 개인 액세스 토큰을 설정합니다.',
      completed: hasToken,
      icon: Github,
    },
    {
      id: 'repository',
      title: 'GitHub 저장소 설정',
      description: '워크플로우를 실행할 GitHub 저장소를 설정합니다.',
      completed: hasRepository,
      icon: GitBranch,
    },
  ];

  // * 설정 완료 시 로딩 화면 표시
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">설정이 완료되었습니다. 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* * 헤더 섹션 */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">PipeMate 설정</h1>
            <p className="text-lg text-gray-600">
              PipeMate를 사용하기 위한 GitHub 설정을 완료하세요
            </p>
          </div>

          {/* * 진행 상황 섹션 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">설정 진행 상황</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">{completedSteps}</span>
                <span className="text-gray-500">/ {totalSteps}</span>
              </div>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {step.completed ? (
                        <div className="w-4 h-4 bg-green-600 rounded-full" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                    {step.completed && (
                      <div className="mt-4">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          완료
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* * 설정 다이얼로그 영역 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              {isChecking ? (
                <div className="text-center space-y-4">
                  <LoadingSpinner />
                  <p className="text-gray-600">설정을 확인하는 중...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Github className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          GitHub 설정
                        </h3>
                        <p className="text-sm text-gray-500">
                          PipeMate 사용을 위한 GitHub 설정을 완료하세요
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 py-6">
                    <Tabs
                      defaultValue="token"
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full h-full flex flex-col"
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="token" className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          <span>토큰</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="repository"
                          className="flex items-center gap-2"
                        >
                          <GitBranch className="h-4 w-4" />
                          <span>레포지토리</span>
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex-1 overflow-y-auto">
                        <TabsContent value="token" className="h-full mt-0">
                          <TokenTab
                            data={{
                              token,
                              savedToken,
                              error: tokenError,
                            }}
                            handlers={{
                              onTokenChange: setToken,
                              onSaveToken: handleSaveToken,
                              onDeleteToken: handleDeleteToken,
                            }}
                          />
                        </TabsContent>

                        <TabsContent value="repository" className="h-full mt-0">
                          <RepositoryTab
                            data={{
                              owner,
                              repo,
                              savedOwner,
                              savedRepo,
                              error: repoError,
                            }}
                            handlers={{
                              onOwnerChange: setOwner,
                              onRepoChange: setRepo,
                              onSaveRepository: handleSaveRepository,
                              onDeleteRepository: handleDeleteRepository,
                            }}
                          />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
