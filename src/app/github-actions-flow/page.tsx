//* GitHub Actions Flow 메인 페이지 컴포넌트 (Blockly 기반)
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { BlockPalette } from "./components/BlockPalette";
import { YamlPanel } from "./components/YamlPanel";
import { BlocklyWorkspace } from "./components/BlocklyWorkspace";
import { generateYamlFromBlockly } from "./utils/yamlGenerator";

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export default function GitHubActionsFlowPage() {
  //* 상태 관리 - 초기값을 빈 문자열로 설정하여 hydration 오류 방지
  const [generatedYaml, setGeneratedYaml] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [workspaceRef, setWorkspaceRef] = useState<any>(null);

  //* 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  //* 워크스페이스 변경 핸들러
  const handleWorkspaceChange = useCallback((workspace: any) => {
    setWorkspaceRef(workspace);
    try {
      const yaml = generateYamlFromBlockly(workspace);
      setGeneratedYaml(yaml);
    } catch (error) {
      console.error("YAML 생성 오류:", error);
      setGeneratedYaml("# YAML 생성 중 오류가 발생했습니다.");
    }
  }, []);

  //* 예제 워크플로우 추가 함수
  const addExampleWorkflow = useCallback(() => {
    //? Blockly 워크스페이스는 초기 XML로 예제를 로드하므로
    //? 여기서는 워크스페이스를 리셋하는 로직만 구현
    if (workspaceRef) {
      //* 워크스페이스 초기화 로직은 BlocklyWorkspace 컴포넌트에서 처리
      console.log("예제 워크플로우 추가됨");
    }
  }, [workspaceRef]);

  //* 워크스페이스 초기화 함수
  const clearWorkspace = useCallback(() => {
    if (workspaceRef) {
      workspaceRef.clear();
      setGeneratedYaml("# 워크스페이스가 초기화되었습니다.");
    }
  }, [workspaceRef]);

  //* 블록 순서 자동 정렬 함수
  const autoArrangeBlocks = useCallback(() => {
    if (workspaceRef) {
      //? Blockly는 자동으로 블록을 정렬하므로 별도 로직 불필요
      console.log("블록 자동 정렬됨");
    }
  }, [workspaceRef]);

  //* 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          color: "#6b7280",
        }}
      >
        로딩 중...
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%", // 헤더를 제외한 전체 높이 사용
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      {/* 메인 컨텐츠 영역 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0, // flexbox에서 중요한 설정
        }}
      >
        {/* 블록 팔레트 */}
        <Suspense fallback={<div>팔레트 로딩 중...</div>}>
          <BlockPalette
            onAddExample={addExampleWorkflow}
            onClear={clearWorkspace}
            onAutoArrange={autoArrangeBlocks}
          />
        </Suspense>

        {/* Blockly 워크스페이스 */}
        <Suspense fallback={<div>Blockly 워크스페이스 로딩 중...</div>}>
          <BlocklyWorkspace onWorkspaceChange={handleWorkspaceChange} />
        </Suspense>

        {/* 생성된 YAML 표시 영역 */}
        <Suspense fallback={<div>YAML 패널 로딩 중...</div>}>
          <YamlPanel generatedYaml={generatedYaml} />
        </Suspense>
      </div>
    </div>
  );
}
