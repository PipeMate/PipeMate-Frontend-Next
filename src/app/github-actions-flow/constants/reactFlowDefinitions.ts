//* ========================================
//* React Flow 노드 정의 및 상수
//* ========================================
//* 이 파일은 React Flow 기반 GitHub Actions 워크플로우 에디터의
//* 노드 타입, 템플릿, 초기 설정을 정의합니다.

import { Node, Edge } from "@xyflow/react";

//* ========================================
//* 노드 타입 상수
//* ========================================

//* React Flow에서 사용하는 노드 타입 정의
export const NODE_TYPES = {
  WORKFLOW_TRIGGER: "workflowTrigger", //* 워크플로우 트리거 노드
  JOB: "job", //* Job 노드
  STEP: "step", //* Step 노드
} as const;

//* ========================================
//* 노드 템플릿 정의
//* ========================================

//* 각 노드 타입별 기본 템플릿 설정
//? 새로운 노드 생성 시 사용되는 기본값들
export const NODE_TEMPLATES = {
  //* 워크플로우 트리거 템플릿
  workflow_trigger: {
    label: "워크플로우 기본 설정",
    type: NODE_TYPES.WORKFLOW_TRIGGER,
    domain: "github",
    task: ["trigger"],
    description:
      "GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.",
    config: {
      name: "Java CICD",
      on: {
        workflow_dispatch: {},
        push: {
          branches: ["main"],
        },
      },
    },
  },

  //* Job 블록 템플릿
  job: {
    label: "Job 설정",
    type: NODE_TYPES.JOB,
    domain: "github",
    task: ["job"],
    description: "사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.",
    config: {
      jobs: {
        "ci-pipeline": {
          "runs-on": "ubuntu-latest",
        },
      },
    },
  },

  //* ========================================
  //* Step 블록 템플릿들
  //* ========================================

  //* 코드 체크아웃 Step
  checkout_step: {
    label: "Checkout repository",
    type: NODE_TYPES.STEP,
    domain: "github",
    task: ["checkout"],
    description: "GitHub 저장소를 체크아웃하는 단계입니다.",
    config: {
      name: "Checkout repository",
      uses: "actions/checkout@v4",
    },
  },

  //* Java 환경 설정 Step
  java_setup_step: {
    label: "Set up JDK 21",
    type: NODE_TYPES.STEP,
    domain: "java",
    task: ["setup"],
    description:
      "GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.",
    config: {
      name: "Set up JDK 21",
      uses: "actions/setup-java@v4",
      with: {
        distribution: "adopt",
        "java-version": "21",
      },
    },
  },

  //* Gradle 빌드 Step
  gradle_build_step: {
    label: "Gradle 빌드 블록",
    type: NODE_TYPES.STEP,
    domain: "gradle",
    task: ["build"],
    description:
      "Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.",
    config: {
      name: "Gradle Build (no test)",
      run: "chmod +x ./gradlew\n./gradlew clean build -x test",
    },
  },

  //* Gradle 테스트 Step
  gradle_test_step: {
    label: "Gradle 테스트 실행 블록",
    type: NODE_TYPES.STEP,
    domain: "gradle",
    task: ["test"],
    description: "Gradle을 사용하여 테스트를 수행하는 블록입니다.",
    config: {
      name: "Test with Gradle",
      run: "./gradlew test",
    },
  },

  //* Docker 로그인 Step
  docker_login_step: {
    label: "Docker 로그인",
    type: NODE_TYPES.STEP,
    domain: "docker",
    task: ["login"],
    description:
      "Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.",
    config: {
      name: "Docker Login",
      uses: "docker/login-action@v2.2.0",
      with: {
        username: "${{ secrets.DOCKER_USERNAME }}",
        password: "${{ secrets.DOCKER_USERNAME }}",
      },
    },
  },

  //* Docker 빌드 및 푸시 Step
  docker_build_step: {
    label: "Docker 이미지 빌드 및 푸시 블록",
    type: NODE_TYPES.STEP,
    domain: "docker",
    task: ["build", "push"],
    description: "Docker 이미지를 빌드하고 Docker Hub에 푸시하는 단계입니다.",
    config: {
      name: "image build and push docker images",
      uses: "docker/build-push-action@v4.1.1",
      with: {
        context: ".",
        push: true,
        tags: "${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
        "no-cache": true,
      },
    },
  },

  //* SSH 배포 Step
  ssh_deploy_step: {
    label: "Deploy to AWS EC2",
    type: NODE_TYPES.STEP,
    domain: "aws",
    task: ["deploy"],
    description: "AWS EC2 서버에 SSH를 통해 배포하는 단계입니다.",
    config: {
      name: "Deploy to AWS EC2",
      uses: "appleboy/ssh-action@v0.1.10",
      with: {
        host: "${{ secrets.AWS_HOST_IP }}",
        username: "${{ secrets.REMOTE_USER }}",
        key: "${{ secrets.AWS_EC2_PRIVATE_KEY }}",
        port: "${{ secrets.REMOTE_SSH_PORT }}",
        script:
          "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
      },
    },
  },
} as const;

//* ========================================
//* 초기 워크플로우 설정
//* ========================================

//* 워크스페이스 초기화 시 기본으로 생성되는 노드들
//! 사용자가 처음 접속했을 때 보게 될 기본 워크플로우 (빈 상태)
export const INITIAL_NODES: Node[] = [];

//* 초기 노드 간 연결 관계
export const INITIAL_EDGES: Edge[] = [
  {
    id: "trigger-to-job",
    source: "trigger-1",
    target: "job-1",
    type: "straight", // 'smoothstep'에서 'straight'로 변경
    data: {
      label: "워크플로우 → Job",
    },
  },
];

//* ========================================
//* 유틸리티 함수
//* ========================================

//* 새로운 노드 생성 함수
//? 템플릿을 기반으로 새로운 노드를 생성
export const createNode = (
  type: string,
  position: { x: number; y: number },
  parentId?: string
): Node => {
  const template = NODE_TEMPLATES[type as keyof typeof NODE_TEMPLATES];
  if (!template) {
    throw new Error(`Unknown node type: ${type}`);
  }

  const id = `${type}-${Date.now()}`;

  return {
    id,
    type: template.type,
    position,
    parentId: parentId,
    data: {
      label: template.label,
      type: template.type as "workflow_trigger" | "job" | "step",
      domain: "domain" in template ? template.domain : undefined,
      task: "task" in template ? template.task : undefined,
      description: template.description,
      config: template.config,
      parentId,
      jobName: parentId ? "ci-pipeline" : undefined,
    },
  };
};
