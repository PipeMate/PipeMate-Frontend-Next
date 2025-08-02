//* ========================================
//* 프리셋 블록 목 데이터
//* ========================================
//* 백엔드 서버에서 받아올 프리셋 블록 데이터의 목 데이터
//* 나중에 API 호출로 대체될 예정

import { ServerBlock } from "../types";

//* 프리셋 블록 데이터 타입 (백엔드 API 응답과 동일한 구조)
export interface PresetBlock extends ServerBlock {
  id: string; //* 고유 식별자
}

//* 탭별 프리셋 블록 데이터
export const PRESET_BLOCKS: Record<string, PresetBlock[]> = {
  //* 트리거 탭 - 워크플로우 트리거 설정 블록
  trigger: [
    {
      id: "trigger-workflow-basic",
      name: "워크플로우 기본 설정",
      type: "trigger",
      description:
        "GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.",
      config: {
        name: "Java CICD",
        on: {
          workflow_dispatch: {},
          push: {
            branches: ["v2"],
          },
        },
      },
    },
  ],

  //* Job 탭 - Job 설정 블록
  job: [
    {
      id: "job-basic",
      name: "Job 설정",
      type: "job",
      description: "사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.",
      config: {
        jobs: {
          "ci-pipeline": {
            "runs-on": "ubuntu-latest",
          },
        },
      },
    },
  ],

  //* Step 탭 - 다양한 Step 블록들
  step: [
    {
      id: "step-checkout",
      name: "Checkout repository",
      type: "step",
      domain: "github",
      task: ["checkout"],
      description: "GitHub 저장소를 체크아웃하는 단계입니다.",
      config: {
        name: "Checkout repository",
        uses: "actions/checkout@v4",
      },
    },
    {
      id: "step-java-setup",
      name: "Set up JDK 21",
      type: "step",
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
    {
      id: "step-gradle-build",
      name: "Gradle 빌드 블록",
      type: "step",
      domain: "gradle",
      task: ["build"],
      description:
        "Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.",
      config: {
        name: "Gradle Build (no test)",
        run: "chmod +x ./gradlew\n./gradlew clean build -x test",
      },
    },
    {
      id: "step-gradle-test",
      name: "Gradle 테스트 실행 블록",
      type: "step",
      domain: "gradle",
      task: ["test"],
      description: "Gradle을 사용하여 테스트를 수행하는 블록입니다.",
      config: {
        name: "Test with Gradle",
        run: "./gradlew test",
      },
    },
    {
      id: "step-docker-login",
      name: "Docker 로그인",
      type: "step",
      domain: "docker",
      task: ["login"],
      description:
        "Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.",
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
      id: "step-docker-build-push",
      name: "Docker 이미지 빌드 및 푸시 블록",
      type: "step",
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
    {
      id: "step-aws-deploy",
      name: "Deploy to AWS EC2",
      type: "step",
      domain: "aws",
      task: ["deploy"],
      description: "Docker 이미지를 EC2 서버에 배포하는 단계입니다.",
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
  ],
};

//* ========================================
//* API 시뮬레이션 함수 (나중에 실제 API 호출로 대체)
//* ========================================

//* 프리셋 블록 데이터를 가져오는 함수 (API 호출 시뮬레이션)
export const fetchPresetBlocks = async (): Promise<
  Record<string, PresetBlock[]>
> => {
  //* 실제로는 백엔드 API 호출
  //* const response = await fetch('/api/preset-blocks');
  //* return response.json();

  //* 현재는 목 데이터 반환
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(PRESET_BLOCKS);
    }, 100); //* API 호출 시뮬레이션을 위한 지연
  });
};

//* 특정 탭의 프리셋 블록을 가져오는 함수
export const fetchPresetBlocksByTab = async (
  tab: string
): Promise<PresetBlock[]> => {
  const allBlocks = await fetchPresetBlocks();
  return allBlocks[tab] || [];
};
