//* 드래그 앤 드롭 사이드바 컴포넌트
"use client";

import { useCallback, useState } from "react";
import { ServerBlock } from "../types";
import { Package, RefreshCcw, Cog, Wrench, Lightbulb } from "lucide-react";
import React from "react";

type TabType = "trigger" | "job" | "step";

export const DragDropSidebar = () => {
  const [activeTab, setActiveTab] = useState<TabType>("trigger");

  //* 드래그 시작 핸들러
  const onDragStart = useCallback(
    (event: React.DragEvent, block: ServerBlock) => {
      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify(block)
      );
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  //* 기본 블록 템플릿들
  const blockTemplates: Record<TabType, ServerBlock[]> = {
    trigger: [
      {
        name: "워크플로우 트리거",
        type: "trigger",
        category: "workflow",
        description: "GitHub Actions 워크플로우 트리거 설정",
        config: {
          name: "My Workflow",
          on: {
            workflow_dispatch: {},
            push: {
              branches: ["main"],
            },
          },
        },
      },
    ],
    job: [
      {
        name: "Job 설정",
        type: "job",
        category: "workflow",
        description: "GitHub Actions Job 설정",
        config: {
          jobs: {
            "build-job": {
              "runs-on": "ubuntu-latest",
            },
          },
        },
      },
    ],
    step: [
      {
        name: "Checkout",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "workflow",
        description: "저장소 체크아웃",
        config: {
          name: "Checkout repository",
          uses: "actions/checkout@v4",
        },
      },
      {
        name: "Java Setup",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "setup",
        description: "Java 환경 설정",
        config: {
          name: "Set up JDK 21",
          uses: "actions/setup-java@v4",
          with: {
            distribution: "adopt",
            "java-version": "21",
          },
        },
      },
      {
        name: "Gradle Build",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "build",
        description: "Gradle 빌드 실행",
        config: {
          name: "Build with Gradle",
          run: "./gradlew build",
        },
      },
      {
        name: "Gradle Test",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "test",
        description: "Gradle 테스트 실행",
        config: {
          name: "Test with Gradle",
          run: "./gradlew test",
        },
      },
      {
        name: "Docker Login",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "docker",
        description: "Docker Hub 로그인",
        config: {
          name: "Docker Login",
          uses: "docker/login-action@v2.2.0",
          with: {
            username: "${{ secrets.DOCKER_USERNAME }}",
            password: "${{ secrets.DOCKER_PASSWORD }}",
          },
        },
      },
      {
        name: "Docker Build & Push",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "deploy",
        description: "Docker 이미지 빌드 및 푸시",
        config: {
          name: "Build and push Docker image",
          uses: "docker/build-push-action@v4.1.1",
          with: {
            context: ".",
            push: true,
            tags: "${{ secrets.DOCKER_USERNAME }}/my-app:latest",
          },
        },
      },
      {
        name: "Deploy to Server",
        type: "step",
        "job-name": "", // 동적으로 설정됨
        category: "deploy",
        description: "서버에 배포",
        config: {
          name: "Deploy to server",
          uses: "appleboy/ssh-action@v0.1.10",
          with: {
            host: "${{ secrets.HOST }}",
            username: "${{ secrets.USERNAME }}",
            key: "${{ secrets.KEY }}",
            script: "docker pull ${{ secrets.DOCKER_USERNAME }}/my-app:latest",
          },
        },
      },
    ],
  };

  //* 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "workflow":
        return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" };
      case "setup":
        return { bg: "#ecfdf5", border: "#10b981", text: "#065f46" };
      case "build":
        return { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };
      case "test":
        return { bg: "#fce7f3", border: "#ec4899", text: "#be185d" };
      case "deploy":
        return { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" };
      case "docker":
        return { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" };
      default:
        return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" };
    }
  };

  //* 블록 타입별 아이콘
  const getBlockIcon = (type: string) => {
    switch (type) {
      case "trigger":
        return <RefreshCcw size={18} />;
      case "job":
        return <Cog size={18} />;
      case "step":
        return <Wrench size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  //* 탭 정보
  const tabs: { type: TabType; label: string; icon: React.ReactNode }[] = [
    { type: "trigger", label: "트리거", icon: <RefreshCcw size={18} /> },
    { type: "job", label: "Job", icon: <Cog size={18} /> },
    { type: "step", label: "Step", icon: <Wrench size={18} /> },
  ];

  return (
    <div className="w-full border-t border-gray-200 flex flex-col h-full min-w-0 min-h-0 box-border">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 w-full">
        <h3 className="text-base font-semibold text-gray-700 mb-2 text-center w-full">
          <Package size={18} className="inline mr-2" /> 블록 라이브러리
        </h3>
        <div className="text-xs text-gray-500 text-center leading-[1.4] w-full">
          블록을 드래그하여 워크스페이스에 추가하세요
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`flex-1 px-2 py-3 text-xs font-semibold border-none cursor-pointer transition-all flex flex-col items-center gap-1 w-full
              ${
                activeTab === tab.type
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-gray-500 hover:bg-slate-100"
              }
            `}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 블록 리스트 */}
      <div className="flex-1 p-4 overflow-y-auto w-full flex flex-col justify-between">
        <div className="flex flex-col gap-3 w-full">
          {blockTemplates[activeTab].map((block, index) => {
            const colors = getCategoryColor(block.category);
            const icon = getBlockIcon(block.type);

            return (
              <div
                key={index}
                draggable
                onDragStart={(e) => onDragStart(e, block)}
                style={{
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                  color: colors.text,
                  cursor: "grab",
                  userSelect: "none",
                  width: "100%",
                }}
                className="p-3 rounded-lg transition-all w-full"
                onMouseDown={(e) => {
                  e.currentTarget.style.cursor = "grabbing";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.cursor = "grab";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.cursor = "grab";
                }}
              >
                <div className="flex items-center gap-2 mb-1.5 w-full">
                  <span className="text-base">{icon}</span>
                  <span
                    style={{ color: colors.text }}
                    className="text-sm font-semibold w-full"
                  >
                    {block.name}
                  </span>
                </div>

                <div
                  style={{ color: colors.text, opacity: 0.8 }}
                  className="text-[11px] leading-[1.3] w-full"
                >
                  {block.description}
                </div>

                <div
                  style={{
                    backgroundColor: colors.border,
                    color: "#ffffff",
                  }}
                  className="mt-1.5 px-2 py-1 text-[10px] rounded font-medium inline-block w-auto"
                >
                  {block.type.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 사용법 안내 */}
        <div className="mt-5 p-3 bg-slate-50 border border-gray-200 rounded-lg text-[11px] text-gray-500 leading-[1.4] w-full">
          <strong>
            <Lightbulb size={14} className="inline mr-1" /> 사용법:
          </strong>
          <br />
          • 블록을 드래그하여 워크스페이스에 드롭
          <br />
          • Job 블록 아래에 Step 블록을 드롭하면 자동으로 연결
          <br />• 트리거 블록은 최상위에 배치됩니다
        </div>
      </div>
    </div>
  );
};
