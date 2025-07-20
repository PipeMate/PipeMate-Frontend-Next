"use client";

import { BRAND, HOME } from "@/config";
import { useRouter } from "next/navigation";

// * 히어로 섹션 컴포넌트
function HeroSection() {
  return (
    <div className="text-center mb-16 flex-shrink-0">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-blue-100 rounded-full">
          <BRAND.logo.icon className="w-12 h-12 text-blue-600" />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{BRAND.name}</h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        {HOME.hero.title}
      </p>
    </div>
  );
}

// * 기능 섹션 컴포넌트
function FeaturesSection() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 flex-shrink-0">
      {HOME.features.map((feature, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex items-center mb-4">
            <feature.icon className={`w-8 h-8 mr-3 ${feature.color}`} />
            <h3 className="text-lg font-semibold text-gray-900">
              {feature.title}
            </h3>
          </div>
          <p className="text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

// * CTA 섹션 컴포넌트
function CTASection() {
  const router = useRouter();

  const handleCTAClick = () => {
    router.push(HOME.cta.url);
  };

  return (
    <div className="text-center flex-1 flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {HOME.cta.title}
      </h2>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        {HOME.cta.description}
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleCTAClick}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {HOME.cta.button}
        </button>
      </div>
    </div>
  );
}

// * 홈 페이지 컨텐츠 컴포넌트
export function HomeContent() {
  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-auto">
      <div className="container mx-auto px-6 py-16 h-full flex flex-col">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </div>
    </div>
  );
}
