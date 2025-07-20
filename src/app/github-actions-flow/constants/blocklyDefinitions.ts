//* Blockly 블록 정의
import { BlocklyBlockDefinition, BlocklyCategoryDefinition } from "../types";

//* GitHub Actions 블록 정의들
export const BLOCKLY_BLOCKS: BlocklyBlockDefinition[] = [
  //* 워크플로우 트리거 블록
  {
    type: "workflow_trigger",
    message0: "워크플로우 트리거 %1 워크플로우명: %2 브랜치: %3",
    args0: [
      { type: "input_dummy", name: "DUMMY" },
      { type: "field_input", name: "WORKFLOW_NAME", text: "My Workflow" },
      { type: "field_input", name: "BRANCH", text: "main" },
    ],
    previousStatement: null,
    nextStatement: "workflow_block",
    colour: 230, // 파란색
    tooltip: "워크플로우 실행 조건을 설정합니다",
    helpUrl: "",
  },

  //* Job 블록 - Step 블록들을 포함할 수 있도록 수정
  {
    type: "job_block",
    message0: "Job %1 이름: %2 실행환경: %3 %4",
    args0: [
      { type: "input_dummy", name: "DUMMY" },
      { type: "field_input", name: "JOB_NAME", text: "build" },
      {
        type: "field_dropdown",
        name: "RUNS_ON",
        options: [
          ["Ubuntu Latest", "ubuntu-latest"],
          ["Ubuntu 22.04", "ubuntu-22.04"],
          ["Ubuntu 20.04", "ubuntu-20.04"],
          ["Windows Latest", "windows-latest"],
          ["macOS Latest", "macos-latest"],
        ],
      },
      { type: "input_statement", name: "STEPS" },
    ],
    previousStatement: "workflow_block",
    nextStatement: "job_block",
    colour: 160, // 초록색
    tooltip: "새로운 Job을 생성합니다. 내부에 Step들을 추가할 수 있습니다.",
    helpUrl: "",
  },

  //* Checkout 블록
  {
    type: "checkout_step",
    message0: "Checkout 소스코드",
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "소스 코드를 체크아웃합니다",
    helpUrl: "",
  },

  //* Java 설정 블록
  {
    type: "java_setup_step",
    message0: "Java 설정 버전: %1",
    args0: [
      {
        type: "field_dropdown",
        name: "JAVA_VERSION",
        options: [
          ["Java 21", "21"],
          ["Java 17", "17"],
          ["Java 11", "11"],
          ["Java 8", "8"],
        ],
      },
    ],
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "Java 환경을 설정합니다",
    helpUrl: "",
  },

  //* Gradle 빌드 블록
  {
    type: "gradle_build_step",
    message0: "Gradle 빌드",
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "Gradle로 프로젝트를 빌드합니다",
    helpUrl: "",
  },

  //* Gradle 테스트 블록
  {
    type: "gradle_test_step",
    message0: "Gradle 테스트",
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "Gradle로 테스트를 실행합니다",
    helpUrl: "",
  },

  //* Docker 로그인 블록
  {
    type: "docker_login_step",
    message0: "Docker 로그인",
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "Docker Hub에 로그인합니다",
    helpUrl: "",
  },

  //* Docker 빌드 블록
  {
    type: "docker_build_step",
    message0: "Docker 빌드 태그: %1",
    args0: [{ type: "field_input", name: "DOCKER_TAG", text: "my-app:latest" }],
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "Docker 이미지를 빌드합니다",
    helpUrl: "",
  },

  //* SSH 배포 블록
  {
    type: "ssh_deploy_step",
    message0: "SSH 배포",
    previousStatement: "step_block",
    nextStatement: "step_block",
    colour: 200, // 보라색
    tooltip: "SSH를 통해 서버에 배포합니다",
    helpUrl: "",
  },
];

//* Blockly 카테고리 정의
export const BLOCKLY_CATEGORIES: BlocklyCategoryDefinition[] = [
  {
    name: "워크플로우",
    colour: 230,
    blocks: [BLOCKLY_BLOCKS[0], BLOCKLY_BLOCKS[1]],
  },
  {
    name: "소스 관리",
    colour: 200,
    blocks: [BLOCKLY_BLOCKS[2]],
  },
  {
    name: "환경 설정",
    colour: 200,
    blocks: [BLOCKLY_BLOCKS[3]],
  },
  {
    name: "빌드",
    colour: 200,
    blocks: [BLOCKLY_BLOCKS[4]],
  },
  {
    name: "테스트",
    colour: 200,
    blocks: [BLOCKLY_BLOCKS[5]],
  },
  {
    name: "Docker",
    colour: 200,
    blocks: [BLOCKLY_BLOCKS[6], BLOCKLY_BLOCKS[7]],
  },
  {
    name: "배포",
    colour: 200,
    blocks: [BLOCKLY_BLOCKS[8]],
  },
];

//* 초기 워크스페이스 XML - Job 내부에 Step 블록들이 포함되도록 수정
export const INITIAL_WORKSPACE_XML = `
<xml xmlns="https://developers.google.com/blockly/xml" style="display: none">
  <block type="workflow_trigger" x="50" y="50">
    <field name="WORKFLOW_NAME">My Workflow</field>
    <field name="BRANCH">main</field>
    <next>
      <block type="job_block">
        <field name="JOB_NAME">build</field>
        <field name="RUNS_ON">ubuntu-latest</field>
        <statement name="STEPS">
          <block type="checkout_step"></block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`;
