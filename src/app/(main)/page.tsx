'use client';

import { Button } from '@/components/ui/button';
import { BRAND, HOME, ROUTES } from '@/config';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRepository } from '@/contexts/RepositoryContext';
import { getCookie } from '@/lib/cookieUtils';
import { STORAGES } from '@/config/appConstants';
import { useEffect, useState } from 'react';
import { GithubSettingsDialog } from '@/components/features/GithubSettingsDialog';

// * Hero 섹션 컴포넌트 (개선)
function HeroSection() {
  const router = useRouter();
  const { isConfigured } = useRepository();
  const [hasToken, setHasToken] = useState(false);

  // * 토큰 상태를 실시간으로 감지하는 함수
  const checkTokenStatus = () => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  };

  useEffect(() => {
    checkTokenStatus();
  }, []);

  // * 설정 변경 감지
  useEffect(() => {
    const handleTokenChange = () => {
      checkTokenStatus();
    };

    const handleRepositoryChange = () => {
      // * 레포지토리 변경 시에도 토큰 상태 재확인
      checkTokenStatus();
    };

    window.addEventListener('token-changed', handleTokenChange);
    window.addEventListener('repository-changed', handleRepositoryChange);

    return () => {
      window.removeEventListener('token-changed', handleTokenChange);
      window.removeEventListener('repository-changed', handleRepositoryChange);
    };
  }, []);

  const handleCTAClick = () => {
    // * 설정이 완료된 경우 바로 에디터로, 아니면 설정 페이지로
    if (isConfigured && hasToken) {
      router.push(HOME.cta.url);
    } else {
      router.push(`/setup?redirect=${encodeURIComponent(HOME.cta.url)}`);
    }
  };

  return (
    <div className="text-center py-20 lg:py-32 relative">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-blue-100 rounded-full border-4 border-blue-400 shadow-lg">
          <BRAND.logo.icon className="w-12 h-12 text-blue-600" />
        </div>
      </div>
      <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
        {HOME.hero.title}
      </h1>
      <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-500 mb-4 tracking-tight">
        {HOME.hero.subTitle}
      </h2>
      <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
        {HOME.hero.description}
      </p>
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleCTAClick}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-full font-semibold border-4 border-blue-500 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
        >
          {isConfigured && hasToken ? HOME.cta.button : '시작하기'}
        </Button>
        <Button
          asChild
          variant="outline"
          className="text-lg px-8 py-6 rounded-full font-semibold border-3 border-gray-300 hover:border-gray-400"
        >
          <a href={ROUTES.MONITORING.url}>모니터링 보기</a>
        </Button>
      </div>

      {/* * Hero 이미지 - 실제 워크플로우 에디터 이미지 사용 */}
      <div className="mt-16 relative w-full max-w-6xl mx-auto">
        <div className="relative aspect-video rounded-xl shadow-2xl overflow-hidden bg-white border-4 border-gray-300">
          <Image
            src={HOME.hero.image.src}
            alt={HOME.hero.image.alt}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}

// * 기능 섹션 컴포넌트 (개선)
function FeaturesSection() {
  const router = useRouter();
  const { isConfigured } = useRepository();
  const [hasToken, setHasToken] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // * 토큰 상태를 실시간으로 감지하는 함수
  const checkTokenStatus = () => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  };

  useEffect(() => {
    checkTokenStatus();
  }, []);

  // * 설정 변경 감지
  useEffect(() => {
    const handleTokenChange = () => {
      checkTokenStatus();
    };

    const handleRepositoryChange = () => {
      // * 레포지토리 변경 시에도 토큰 상태 재확인
      checkTokenStatus();
    };

    window.addEventListener('token-changed', handleTokenChange);
    window.addEventListener('repository-changed', handleRepositoryChange);

    return () => {
      window.removeEventListener('token-changed', handleTokenChange);
      window.removeEventListener('repository-changed', handleRepositoryChange);
    };
  }, []);

  const handleFeatureClick = (url: string) => {
    // * 모달창으로 열어야 하는 경우
    if (url === 'modal') {
      setShowSettingsModal(true);
      return;
    }

    // * 일반 페이지 이동
    if (isConfigured && hasToken) {
      router.push(url);
    } else {
      router.push(`/setup?redirect=${encodeURIComponent(url)}`);
    }
  };

  // * 색상별 버튼 border 클래스 매핑 (업데이트)
  const getButtonBorderColor = (color: string) => {
    switch (color) {
      case 'text-blue-600':
        return 'border-blue-500';
      case 'text-green-600':
        return 'border-green-500';
      case 'text-purple-600':
        return 'border-purple-500';
      case 'text-orange-600':
        return 'border-orange-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="py-20 lg:py-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          PipeMate의 주요 기능
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          복잡한 CI/CD 워크플로우를 간편하게 설계하고 관리하는 PipeMate의 핵심 기능을
          만나보세요.
        </p>
      </div>

      {/* * 4개 기능을 2x2 그리드로 배치 */}
      <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        {HOME.features.map((feature, index) => {
          const IconComponent = feature.icon;
          const buttonBorderColor = getButtonBorderColor(feature.color);
          return (
            <div
              key={index}
              className={`bg-white p-8 rounded-2xl shadow-lg border-3 border-gray-200 transition-transform duration-300 hover:scale-105 hover:shadow-xl ${
                index === 0 ? 'border-4 border-blue-300 shadow-xl' : ''
              }`}
            >
              <div
                className="p-4 rounded-full w-fit mb-6 border-3 border-gray-200"
                style={{
                  backgroundColor: `${feature.color
                    .replace('text-', '')
                    .replace('-600', '-100')}`,
                }}
              >
                <IconComponent className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
              <Button
                onClick={() => handleFeatureClick(feature.action.url)}
                className={`${feature.action.color} text-white text-md px-6 py-3 w-full rounded-full font-semibold border-4 ${buttonBorderColor} transition-all duration-300`}
              >
                {isConfigured && hasToken ? feature.action.title : '시작하기'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* * 설정 관리 모달 */}
      <GithubSettingsDialog
        trigger={null}
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        onTokenChange={(token) => {
          if (token) {
            checkTokenStatus();
          }
        }}
      />
    </div>
  );
}

// * CTA 섹션 컴포넌트 (개선)
function CTASection() {
  const router = useRouter();
  const { isConfigured } = useRepository();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = getCookie(STORAGES.GITHUB_TOKEN);
    setHasToken(!!token);
  }, []);

  const handleCTAClick = () => {
    if (isConfigured && hasToken) {
      router.push(HOME.cta.url);
    } else {
      router.push(`/setup?redirect=${encodeURIComponent(HOME.cta.url)}`);
    }
  };

  return (
    <div className="relative overflow-hidden py-20 lg:py-28 my-20 bg-blue-500 rounded-3xl text-white shadow-2xl border-4 border-blue-400 transform transition-transform duration-300 hover:scale-[1.01]">
      <div className="container mx-auto px-6 text-center z-10 relative">
        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight">
          {HOME.cta.title}
        </h2>
        <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
          {HOME.cta.description}
        </p>
        <Button
          onClick={handleCTAClick}
          className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold shadow-lg border-4 border-blue-300"
        >
          {isConfigured && hasToken ? HOME.cta.button : '시작하기'}
        </Button>
      </div>
      <div className="absolute inset-0 opacity-10">
        {/* * 배경 패턴 이미지 또는 도형 추가 */}
      </div>
    </div>
  );
}

// * 메인 홈 페이지 컴포넌트
export default function Home() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </div>
    </div>
  );
}
