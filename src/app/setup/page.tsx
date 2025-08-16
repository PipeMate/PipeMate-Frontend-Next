'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui';
import { GithubSettingsDialog } from '@/components/features/GithubSettingsDialog';
import { useRepository } from '@/contexts/RepositoryContext';
import { getCookie, setRepositoryConfig } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';
import {
  Github,
  GitBranch,
  Shield,
  CheckCircle,
  ArrowRight,
  Settings,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConfigured, setRepository } = useRepository();
  const [hasToken, setHasToken] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [repoError, setRepoError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/workflows';

  useEffect(() => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  }, []);

  useEffect(() => {
    // 설정이 완료되면 원하는 페이지로 리다이렉트
    if (isConfigured && hasToken && !isRedirecting) {
      setIsRedirecting(true);
      // 약간의 지연을 두어 완료 메시지를 볼 수 있도록 함
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    }
  }, [isConfigured, hasToken, router, redirectUrl, isRedirecting]);

  const handleRepositorySave = () => {
    if (!owner.trim() || !repo.trim()) {
      setRepoError('소유자와 레포지토리 이름을 모두 입력해주세요.');
      return;
    }

    if (!hasToken) {
      setRepoError('먼저 GitHub 토큰을 설정해주세요.');
      return;
    }

    try {
      setRepositoryConfig(owner.trim(), repo.trim());
      setRepository(owner.trim(), repo.trim());
      setRepoError('');
    } catch (error) {
      setRepoError('레포지토리 설정 중 오류가 발생했습니다.');
    }
  };

  const handleTokenChange = (token: string | null) => {
    setHasToken(!!token);
  };

  const setupSteps = [
    {
      icon: Github,
      title: 'GitHub 토큰 설정',
      description:
        'GitHub Personal Access Token을 설정하여 PipeMate가 GitHub에 접근할 수 있도록 합니다.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      completed: hasToken,
      priority: 1,
    },
    {
      icon: GitBranch,
      title: '레포지토리 설정',
      description: '워크플로우를 관리할 GitHub 레포지토리를 선택합니다.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      completed: isConfigured,
      priority: 2,
    },
    {
      icon: Shield,
      title: '시크릿 관리',
      description: '민감한 정보를 안전하게 관리하고 워크플로우에서 활용합니다.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      completed: false, // 시크릿은 선택사항
      priority: 3,
    },
  ];

  const completedSteps = setupSteps.filter((step) => step.completed).length;
  const totalSteps = setupSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-12 sm:mb-20">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="p-4 sm:p-6 bg-blue-500 rounded-2xl sm:rounded-3xl shadow-lg border-4 border-blue-300">
                  <Settings className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 p-2 sm:p-3 bg-yellow-400 rounded-full shadow-lg border-2 border-yellow-300">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-900" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              PipeMate 설정
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              PipeMate를 사용하기 위해 몇 가지 설정을 완료해주세요.{' '}
              <span className="font-semibold text-blue-600">
                설정이 완료되면 자동으로 원하는 페이지로 이동합니다.
              </span>
            </p>
            {redirectUrl !== '/workflows' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-100 rounded-full border-2 border-blue-200">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-blue-700">
                  설정 완료 후 <span className="font-bold">{redirectUrl}</span>로 이동
                </span>
              </div>
            )}
          </div>

          {/* 진행 상태 바 */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-4 border-gray-200 p-6 sm:p-8 lg:p-10">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  설정 진행 상황
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {completedSteps}
                  </span>
                  <span className="text-gray-500">/ {totalSteps}</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4 sm:h-6 overflow-hidden border-2 border-gray-300">
                  <div
                    className="bg-blue-500 h-4 sm:h-6 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                  <span>시작</span>
                  <span>{Math.round(progressPercentage)}% 완료</span>
                  <span>완료</span>
                </div>
              </div>
            </div>
          </div>

          {/* 설정 단계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {setupSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive =
                !step.completed && (index === 0 || (index === 1 && hasToken));

              return (
                <div key={index} className="relative group">
                  <div
                    className={`relative bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-lg border-4 transition-all duration-500 hover:shadow-xl hover:scale-105 ${
                      step.completed
                        ? 'border-green-300 bg-green-50'
                        : isActive
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {/* 우선순위 배지 */}
                    <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4">
                      <div
                        className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold border-2 ${
                          step.completed
                            ? 'bg-green-500 text-white border-green-400'
                            : isActive
                            ? 'bg-blue-500 text-white border-blue-400'
                            : 'bg-gray-400 text-white border-gray-300'
                        }`}
                      >
                        {step.priority}
                      </div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 lg:mb-8 transition-all duration-300 border-3 ${
                          step.completed
                            ? 'bg-green-100 border-green-300 shadow-lg'
                            : isActive
                            ? 'bg-blue-100 border-blue-300 shadow-lg'
                            : `${step.bgColor} ${step.borderColor} border-3`
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600" />
                        ) : (
                          <IconComponent
                            className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${step.color}`}
                          />
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6">
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6 lg:mb-8">
                        {step.description}
                      </p>

                      {/* 설정 버튼 */}
                      {index === 0 && !step.completed && (
                        <div className="space-y-4 sm:space-y-6">
                          <GithubSettingsDialog
                            onTokenChange={handleTokenChange}
                            trigger={
                              <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl border-2 border-gray-500 text-sm sm:text-base">
                                <Github className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                GitHub 토큰 설정
                              </Button>
                            }
                          />
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full border-2 py-2 sm:py-3 text-sm"
                          >
                            <a
                              href="https://github.com/settings/tokens"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                              GitHub 토큰 생성 가이드
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* 레포지토리 설정 */}
                      {index === 1 && !step.completed && hasToken && (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="space-y-3 sm:space-y-4">
                            <Input
                              placeholder="소유자 (예: username)"
                              value={owner}
                              onChange={(e) => setOwner(e.target.value)}
                              className="text-sm border-3 focus:border-blue-500 focus:ring-blue-500 py-2 sm:py-3"
                            />
                            <Input
                              placeholder="레포지토리 이름 (예: my-project)"
                              value={repo}
                              onChange={(e) => setRepo(e.target.value)}
                              className="text-sm border-3 focus:border-blue-500 focus:ring-blue-500 py-2 sm:py-3"
                            />
                            {repoError && (
                              <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm bg-red-50 p-3 sm:p-4 rounded-lg border-2 border-red-200">
                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                {repoError}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={handleRepositorySave}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl border-2 border-blue-500 text-sm sm:text-base"
                            size="sm"
                          >
                            <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            레포지토리 설정
                          </Button>
                        </div>
                      )}

                      {index === 1 && !step.completed && !hasToken && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
                          <div className="flex items-center gap-2 text-blue-700">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-medium text-sm sm:text-base">
                              GitHub 토큰 설정 후 레포지토리를 선택할 수 있습니다.
                            </span>
                          </div>
                        </div>
                      )}

                      {step.completed && (
                        <div className="flex items-center justify-center text-green-600 font-semibold bg-green-50 p-4 sm:p-6 rounded-xl border-2 border-green-200 text-sm sm:text-base">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          완료
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 연결선 */}
                  {index < setupSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 sm:-right-4 transform -translate-y-1/2 z-10">
                      <div className="bg-white p-2 sm:p-3 rounded-full shadow-lg border-3 border-gray-300">
                        <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 완료 메시지 */}
          {isConfigured && hasToken && (
            <div className="text-center">
              <div className="bg-green-50 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border-4 border-green-200 shadow-2xl max-w-2xl sm:max-w-3xl mx-auto">
                <div className="flex items-center justify-center mb-6 sm:mb-8">
                  <div className="p-4 sm:p-6 bg-green-100 rounded-full border-3 border-green-300">
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  설정이 완료되었습니다! 🎉
                </h3>
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                  {isRedirecting
                    ? `${redirectUrl}로 이동합니다...`
                    : '잠시 후 원하는 페이지로 이동합니다.'}
                </p>
                {isRedirecting && (
                  <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
