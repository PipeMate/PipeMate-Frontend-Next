//* Blockly 워크스페이스 컴포넌트
"use client";

import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { BlocklyWorkspaceProps } from "../types";
import {
  BLOCKLY_BLOCKS,
  INITIAL_WORKSPACE_XML,
} from "../constants/blocklyDefinitions";
import "@/styles/blockly.css"; // Blockly 전용 스타일 import

//! Hydration 오류 방지를 위한 클라이언트 사이드 렌더링
export const BlocklyWorkspace = ({
  onWorkspaceChange,
  initialXml,
}: BlocklyWorkspaceProps) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [isClient, setIsClient] = useState(false);

  //* 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  //* Blockly 워크스페이스 초기화
  useEffect(() => {
    if (!isClient || !blocklyDiv.current) return;

    //* Blockly 블록 정의 등록
    BLOCKLY_BLOCKS.forEach((blockDef) => {
      Blockly.Blocks[blockDef.type] = {
        init: function (this: Blockly.Block) {
          this.jsonInit(blockDef);
        },
      };
    });

    //* 워크스페이스 생성
    const workspace = Blockly.inject(blocklyDiv.current, {
      toolbox: {
        kind: "categoryToolbox",
        contents: [
          {
            kind: "category",
            name: "워크플로우",
            colour: "230",
            contents: [
              { kind: "block", type: "workflow_trigger" },
              { kind: "block", type: "job_block" },
            ],
          },
          {
            kind: "category",
            name: "소스 관리",
            colour: "200",
            contents: [{ kind: "block", type: "checkout_step" }],
          },
          {
            kind: "category",
            name: "환경 설정",
            colour: "200",
            contents: [{ kind: "block", type: "java_setup_step" }],
          },
          {
            kind: "category",
            name: "빌드",
            colour: "200",
            contents: [{ kind: "block", type: "gradle_build_step" }],
          },
          {
            kind: "category",
            name: "테스트",
            colour: "200",
            contents: [{ kind: "block", type: "gradle_test_step" }],
          },
          {
            kind: "category",
            name: "Docker",
            colour: "200",
            contents: [
              { kind: "block", type: "docker_login_step" },
              { kind: "block", type: "docker_build_step" },
            ],
          },
          {
            kind: "category",
            name: "배포",
            colour: "200",
            contents: [{ kind: "block", type: "ssh_deploy_step" }],
          },
        ],
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: "#ccc",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      scrollbars: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    });

    workspaceRef.current = workspace;

    //* 초기 XML 로드
    const xmlToLoad = initialXml || INITIAL_WORKSPACE_XML;
    const xml = Blockly.utils.xml.textToDom(xmlToLoad);
    Blockly.Xml.domToWorkspace(xml, workspace);

    //* 워크스페이스 크기 조정 함수
    const resizeWorkspace = () => {
      if (workspace && blocklyDiv.current) {
        const container = blocklyDiv.current;
        const rect = container.getBoundingClientRect();

        //* 컨테이너 크기에 맞춰 워크스페이스 크기 조정
        workspace.resizeContents();

        //* 워크스페이스가 컨테이너를 꽉 채우도록 설정
        const svg = workspace.getParentSvg();
        if (svg) {
          svg.setAttribute("width", rect.width.toString());
          svg.setAttribute("height", rect.height.toString());
        }
      }
    };

    //* 초기 크기 조정
    setTimeout(resizeWorkspace, 100);

    //* 리사이즈 이벤트 리스너
    const handleResize = () => {
      resizeWorkspace();
    };

    //* ResizeObserver를 사용하여 더 정확한 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      resizeWorkspace();
    });

    if (blocklyDiv.current) {
      resizeObserver.observe(blocklyDiv.current);
    }

    window.addEventListener("resize", handleResize);

    //* 워크스페이스 변경 이벤트 리스너
    const workspaceChangeListener = () => {
      if (onWorkspaceChange) {
        onWorkspaceChange(workspace);
      }
    };

    workspace.addChangeListener(workspaceChangeListener);

    //* 툴박스 스크롤바 관리 함수
    const manageToolboxScrollbar = () => {
      const toolboxDiv = document.querySelector(
        ".blocklyToolboxDiv"
      ) as HTMLElement;
      if (!toolboxDiv) return;

      //* 툴박스가 실제로 보이는지 확인하는 여러 방법
      const isVisible =
        toolboxDiv.style.display !== "none" &&
        toolboxDiv.offsetWidth > 0 &&
        toolboxDiv.offsetHeight > 0 &&
        getComputedStyle(toolboxDiv).visibility !== "hidden";

      if (isVisible) {
        toolboxDiv.classList.remove("blocklyToolboxClosed");
        //* 스크롤바가 필요하지 않으면 숨김
        if (toolboxDiv.scrollHeight <= toolboxDiv.clientHeight) {
          toolboxDiv.style.overflowY = "hidden";
          toolboxDiv.style.scrollbarWidth = "none";
        } else {
          toolboxDiv.style.overflowY = "auto";
          toolboxDiv.style.scrollbarWidth = "thin";
        }
      } else {
        toolboxDiv.classList.add("blocklyToolboxClosed");
        toolboxDiv.style.overflowY = "hidden";
        toolboxDiv.style.scrollbarWidth = "none";
        //* 강제로 스크롤바 숨김
        toolboxDiv.style.setProperty(
          "--webkit-scrollbar-width",
          "0px",
          "important"
        );
      }

      //* 모든 스크롤바 관련 요소 강제 숨김
      const scrollbars = toolboxDiv.querySelectorAll(
        ".blocklyScrollbarVertical, .blocklyScrollbarHorizontal"
      );
      scrollbars.forEach((scrollbar: Element) => {
        const scrollbarElement = scrollbar as HTMLElement;
        if (!isVisible || toolboxDiv.scrollHeight <= toolboxDiv.clientHeight) {
          scrollbarElement.style.display = "none";
        } else {
          scrollbarElement.style.display = "block";
        }
      });
    };

    //* MutationObserver로 툴박스 DOM 변화 감지
    const toolboxObserver = new MutationObserver(() => {
      manageToolboxScrollbar();
    });

    //* 툴박스 DOM 감시 시작
    const startToolboxObservation = () => {
      const toolboxDiv = document.querySelector(".blocklyToolboxDiv");
      if (toolboxDiv) {
        toolboxObserver.observe(toolboxDiv, {
          attributes: true,
          attributeFilter: ["style", "class"],
          childList: true,
          subtree: true,
        });
      }
    };

    //* 초기 툴박스 관찰 시작 (지연 후)
    setTimeout(() => {
      startToolboxObservation();
      manageToolboxScrollbar();
    }, 500);

    //* 툴박스 이벤트 리스너 추가
    workspace.addChangeListener((event: Blockly.Events.Abstract) => {
      if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
        setTimeout(manageToolboxScrollbar, 50);
      }
    });

    //* 주기적으로 툴박스 상태 확인 (안전장치)
    const toolboxCheckInterval = setInterval(manageToolboxScrollbar, 1000);

    //* 클린업
    return () => {
      workspace.removeChangeListener(workspaceChangeListener);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      toolboxObserver.disconnect();
      clearInterval(toolboxCheckInterval);

      //* 툴박스 스크롤바 정리
      const toolboxDiv = document.querySelector(
        ".blocklyToolboxDiv"
      ) as HTMLElement;
      if (toolboxDiv) {
        toolboxDiv.classList.add("blocklyToolboxClosed");
        toolboxDiv.style.overflowY = "hidden";
      }

      workspace.dispose();
    };
  }, [isClient, initialXml, onWorkspaceChange]);

  //* 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          color: "#6b7280",
        }}
      >
        Blockly 워크스페이스 로딩 중...
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        minWidth: 0, // flexbox에서 중요한 설정
        minHeight: 0, // flexbox에서 중요한 설정
        overflow: "hidden", // 부모 컨테이너에서 오버플로우 숨김
      }}
    >
      <div
        ref={blocklyDiv}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f9fafb",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </div>
  );
};
