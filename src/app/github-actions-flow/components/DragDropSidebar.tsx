//* 드래그 앤 드롭 사이드바 컴포넌트
"use client";

import { useCallback, useState } from "react";
import { ServerBlock } from "../types";

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
        return "🔄";
      case "job":
        return "⚙️";
      case "step":
        return "🔧";
      default:
        return "📦";
    }
  };

  //* 탭 정보
  const tabs: { type: TabType; label: string; icon: string }[] = [
    { type: "trigger", label: "트리거", icon: "🔄" },
    { type: "job", label: "Job", icon: "⚙️" },
    { type: "step", label: "Step", icon: "🔧" },
  ];

  return (
    <div
      style={{
        width: "280px",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          📦 블록 라이브러리
        </h3>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          블록을 드래그하여 워크스페이스에 추가하세요
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            style={{
              flex: 1,
              padding: "12px 8px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: activeTab === tab.type ? "#3b82f6" : "#f9fafb",
              color: activeTab === tab.type ? "#ffffff" : "#6b7280",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseOver={(e) => {
              if (activeTab !== tab.type) {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== tab.type) {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }
            }}
          >
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 블록 리스트 */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {blockTemplates[activeTab].map((block, index) => {
            const colors = getCategoryColor(block.category);
            const icon = getBlockIcon(block.type);

            return (
              <div
                key={index}
                draggable
                onDragStart={(e) => onDragStart(e, block)}
                style={{
                  padding: "12px",
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: "8px",
                  cursor: "grab",
                  transition: "all 0.2s ease",
                  userSelect: "none",
                }}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{icon}</span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {block.name}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: colors.text,
                    opacity: 0.8,
                    lineHeight: "1.3",
                  }}
                >
                  {block.description}
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    padding: "4px 8px",
                    backgroundColor: colors.border,
                    color: "#ffffff",
                    fontSize: "10px",
                    borderRadius: "4px",
                    display: "inline-block",
                    fontWeight: "500",
                  }}
                >
                  {block.type.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 사용법 안내 */}
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "11px",
            color: "#6b7280",
            lineHeight: "1.4",
          }}
        >
          <strong>💡 사용법:</strong>
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
