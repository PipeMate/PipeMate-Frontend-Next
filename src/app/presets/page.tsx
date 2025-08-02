"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PresetManager from "@/components/features/PresetManager";
import { useLayout } from "@/components/layout/LayoutContext";
import { Settings } from "lucide-react";
import { ROUTES } from "@/config/appConstants";

export default function PresetsPage() {
  const { setHeaderExtra } = useLayout();

  // 헤더 설정
  useEffect(() => {
    setHeaderExtra(
      <div className="flex flex-col gap-0 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 m-0 flex items-center gap-2">
          <Settings size={20} />
          {ROUTES.PRESETS.label}
        </h1>
        <p className="text-sm text-gray-500 m-0">
          GitHub Actions 워크플로우 프리셋 관리
        </p>
      </div>
    );
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">프리셋 관리</h2>
        <p className="text-lg text-gray-600">
          자주 사용하는 GitHub Actions 워크플로우 템플릿을 관리하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>워크플로우 프리셋</CardTitle>
        </CardHeader>
        <CardContent>
          <PresetManager />
        </CardContent>
      </Card>
    </div>
  );
}
