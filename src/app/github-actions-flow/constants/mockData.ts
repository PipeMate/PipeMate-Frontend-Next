//* ========================================
//* 프리셋 블록 목 데이터
//* ========================================
//* 백엔드 서버에서 받아올 프리셋 블록 데이터의 목 데이터
//* 나중에 API 호출로 대체될 예정

import { ServerBlock, Pipeline } from '../types';
import { API_CONFIG, API_ENDPOINTS, getErrorMessage } from '../../../config/apiConfig';

//* 백엔드 API와 일치하는 타입 정의
export interface BlockConfig {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, any>;
  'runs-on'?: string;
  on?: Record<string, any>;
  [key: string]: any;
}

//* 백엔드 BlockResponse와 일치하는 타입
export interface BlockData {
  id?: number;
  name: string;
  type: 'trigger' | 'job' | 'step';
  description: string;
  config: BlockConfig;
  jobName?: string; // 백엔드에서는 jobName으로 사용
  domain?: string;
  task?: string[];
}

//* 백엔드 PipelineRequest와 일치하는 타입
export interface WorkflowRequest {
  owner: string;
  repo: string;
  workflowName: string;
  inputJson: BlockData[];
  description?: string;
}

//* 백엔드 PipelineResponse와 일치하는 타입
export interface WorkflowResponse {
  workflowId: string;
  workflowName: string;
  originalJson: BlockData[];
  success: boolean;
  message: string;
}

//* 프리셋 블록 데이터 타입 (백엔드 API 응답과 동일한 구조)
export interface PresetBlock extends ServerBlock {
  id: string; //* 고유 식별자
}

//* 프리셋 파이프라인 데이터 타입 (백엔드 API 응답과 동일한 구조)
export interface PresetPipeline extends Pipeline {
  id: string; //* 고유 식별자
}

//* 탭별 프리셋 블록 데이터 (새로운 구조)
export const PRESET_BLOCKS: Record<string, BlockData[]> = {
  //* 트리거 탭 - 워크플로우 트리거 설정 블록
  trigger: [
    {
      name: '워크플로우 기본 설정',
      type: 'trigger',
      description: 'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
      config: {
        name: 'Java CICD',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['v2'],
          },
        },
      },
    },
  ],

  //* Job 탭 - Job 설정 블록
  job: [
    {
      name: 'Job 설정',
      type: 'job',
      jobName: 'job1',
      description: '사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.',
      config: {
        'runs-on': 'ubuntu-latest',
      },
    },
  ],

  //* Step 탭 - 다양한 Step 블록들
  step: [
    {
      name: 'Checkout repository',
      type: 'step',
      domain: 'github',
      task: ['checkout'],
      description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
      jobName: 'job1',
      config: {
        name: 'Checkout repository',
        uses: 'actions/checkout@v4',
      },
    },
    {
      name: 'Set up JDK 21',
      type: 'step',
      domain: 'java',
      task: ['setup'],
      description: 'GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.',
      jobName: 'job1',
      config: {
        name: 'Set up JDK 21',
        uses: 'actions/setup-java@v4',
        with: {
          distribution: 'adopt',
          'java-version': '21',
        },
      },
    },
    {
      name: 'Gradle 빌드 블록',
      type: 'step',
      domain: 'gradle',
      task: ['build'],
      description: 'Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.',
      jobName: 'job1',
      config: {
        name: 'Gradle Build (no test)',
        run: 'chmod +x ./gradlew\n./gradlew clean build -x test',
      },
    },
    {
      name: 'Gradle 테스트 실행 블록',
      type: 'step',
      domain: 'gradle',
      task: ['test'],
      description: 'Gradle을 사용하여 테스트를 수행하는 블록입니다.',
      jobName: 'job1',
      config: {
        name: 'Test with Gradle',
        run: './gradlew test',
      },
    },
    {
      name: 'Docker 로그인',
      type: 'step',
      domain: 'docker',
      task: ['login'],
      description: 'Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.',
      jobName: 'job1',
      config: {
        name: 'Docker Login',
        uses: 'docker/login-action@v2.2.0',
        with: {
          username: '${{ secrets.DOCKER_USERNAME }}',
          password: '${{ secrets.DOCKER_PASSWORD }}',
        },
      },
    },
    {
      name: 'Docker 이미지 빌드 및 푸시 블록',
      type: 'step',
      domain: 'docker',
      task: ['build', 'push'],
      description: 'Docker 이미지를 빌드하고 Docker Hub에 푸시하는 단계입니다.',
      jobName: 'job1',
      config: {
        name: 'image build and push docker images',
        uses: 'docker/build-push-action@v4.1.1',
        with: {
          context: '.',
          push: true,
          tags: '${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest',
          'no-cache': true,
        },
      },
    },
    {
      name: 'Deploy to AWS EC2',
      type: 'step',
      domain: 'aws',
      task: ['deploy'],
      description: 'Docker 이미지를 EC2 서버에 배포하는 단계입니다.',
      jobName: 'job1',
      config: {
        name: 'Deploy to AWS EC2',
        uses: 'appleboy/ssh-action@v0.1.10',
        with: {
          host: '${{ secrets.AWS_HOST_IP }}',
          username: '${{ secrets.REMOTE_USER }}',
          key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
          port: '${{ secrets.REMOTE_SSH_PORT }}',
          script:
            "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
        },
      },
    },
  ],
};

//* ========================================
//* 새로운 구조 예시 데이터
//* ========================================

//* 워크플로우 요청 예시 (프론트엔드 -> 백엔드)
export const EXAMPLE_WORKFLOW_REQUEST: WorkflowRequest = {
  owner: 'donghyuun',
  repo: 'pipemate',
  workflowName: 'T-FLOW1015',
  inputJson: [
    {
      name: '워크플로우 기본 설정',
      type: 'trigger',
      description: 'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
      config: {
        name: 'Java CICD',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['v2'],
          },
        },
      },
    },
    {
      name: 'Job 설정',
      type: 'job',
      jobName: 'job1',
      description: '사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.',
      config: {
        'runs-on': 'ubuntu-latest',
      },
    },
    {
      name: 'Checkout repository',
      type: 'step',
      jobName: 'job1',
      domain: 'github',
      task: ['checkout'],
      description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
      config: {
        name: 'Checkout repository',
        uses: 'actions/checkout@v4',
      },
    },
    {
      name: 'Set up JDK 21',
      type: 'step',
      jobName: 'job1',
      domain: 'java',
      task: ['setup'],
      description: 'GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.',
      config: {
        name: 'Set up JDK 21',
        uses: 'actions/setup-java@v4',
        with: {
          distribution: 'adopt',
          'java-version': '21',
        },
      },
    },
    {
      name: 'Gradle 빌드 블록',
      type: 'step',
      jobName: 'job1',
      domain: 'gradle',
      task: ['build'],
      description: 'Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.',
      config: {
        name: 'Gradle Build (no test)',
        run: 'chmod +x ./gradlew\n./gradlew clean build -x test',
      },
    },
    {
      name: 'Gradle 테스트 실행 블록',
      type: 'step',
      jobName: 'job1',
      domain: 'gradle',
      task: ['test'],
      description: 'Gradle을 사용하여 테스트를 수행하는 블록입니다.',
      config: {
        name: 'Test with Gradle',
        run: './gradlew test',
      },
    },
    {
      name: 'Docker 로그인',
      type: 'step',
      jobName: 'job1',
      domain: 'docker',
      task: ['login'],
      description: 'Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.',
      config: {
        name: 'Docker Login',
        uses: 'docker/login-action@v2.2.0',
        with: {
          username: '${{ secrets.DOCKER_USERNAME }}',
          password: '${{ secrets.DOCKER_PASSWORD }}',
        },
      },
    },
    {
      name: 'Docker 이미지 빌드 및 푸시 블록',
      type: 'step',
      jobName: 'job1',
      domain: 'docker',
      task: ['build', 'push'],
      description: 'Docker 이미지를 빌드하고 Docker Hub에 푸시하는 단계입니다.',
      config: {
        name: 'image build and push docker images',
        uses: 'docker/build-push-action@v4.1.1',
        with: {
          context: '.',
          push: true,
          tags: '${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest',
          'no-cache': true,
        },
      },
    },
    {
      name: 'Deploy to AWS EC2',
      type: 'step',
      jobName: 'job1',
      domain: 'aws',
      task: ['deploy'],
      description: 'Docker 이미지를 EC2 서버에 배포하는 단계입니다.',
      config: {
        name: 'Deploy to AWS EC2',
        uses: 'appleboy/ssh-action@v0.1.10',
        with: {
          host: '${{ secrets.AWS_HOST_IP }}',
          username: '${{ secrets.REMOTE_USER }}',
          key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
          port: '${{ secrets.REMOTE_SSH_PORT }}',
          script:
            "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
        },
      },
    },
    {
      name: 'Job 설정2',
      type: 'job',
      jobName: 'job2',
      description: '사용자 정의 job-id와 실행 환경을 설정하는 블록입니다.',
      config: {
        'runs-on': 'ubuntu-latest',
      },
    },
    {
      name: 'Checkout repository',
      type: 'step',
      jobName: 'job2',
      domain: 'github',
      task: ['checkout'],
      description: 'GitHub 저장소를 체크아웃하는 단계입니다.22',
      config: {
        name: 'Checkout repository',
        uses: 'actions/checkout@v4',
      },
    },
  ],
  description: 'Java CI/CD 파이프라인 예시',
};

//* 워크플로우 응답 예시 (백엔드 -> 프론트엔드)
export const EXAMPLE_WORKFLOW_RESPONSE: WorkflowResponse = {
  workflowId: '',
  workflowName: 'T-FLOW1015',
  originalJson: EXAMPLE_WORKFLOW_REQUEST.inputJson,
  success: true,
  message: 'Workflow loaded and parsed from GitHub',
};

//* ========================================
//* 프리셋 파이프라인 목 데이터
//* ========================================
//* 완성된 워크플로우 파이프라인 데이터
//* 사용자가 전체 파이프라인을 드래그 앤 드롭으로 사용할 수 있음

export const PRESET_PIPELINES: Record<string, PresetPipeline[]> = {
  //* CI/CD 파이프라인
  cicd: [
    {
      id: 'pipeline-java-cicd',
      name: 'Java CI/CD 파이프라인',
      description:
        'Java 프로젝트를 위한 완전한 CI/CD 파이프라인입니다. 빌드, 테스트, Docker 이미지 생성 및 배포를 포함합니다.',
      type: 'cicd',
      domain: 'java',
      task: ['build', 'test', 'deploy'],
      blocks: [
        {
          id: 'trigger-workflow-basic',
          name: '워크플로우 기본 설정',
          type: 'trigger',
          description:
            'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
          config: {
            name: 'Java CICD',
            on: {
              workflow_dispatch: {},
              push: {
                branches: ['v2'],
              },
            },
          },
        },
        {
          id: 'job-ci-pipeline',
          name: 'CI Pipeline Job',
          type: 'job',
          description: 'CI 파이프라인을 실행하는 Job입니다.',
          'job-name': 'job1',
          config: {
            jobs: {
              job1: {
                'runs-on': 'ubuntu-latest',
              },
            },
          },
        },
        {
          id: 'step-checkout',
          name: 'Checkout repository',
          type: 'step',
          domain: 'github',
          task: ['checkout'],
          description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Checkout repository',
            uses: 'actions/checkout@v4',
          },
        },
        {
          id: 'step-java-setup',
          name: 'Set up JDK 21',
          type: 'step',
          domain: 'java',
          task: ['setup'],
          description:
            'GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Set up JDK 21',
            uses: 'actions/setup-java@v4',
            with: {
              distribution: 'adopt',
              'java-version': '21',
            },
          },
        },
        {
          id: 'step-gradle-build',
          name: 'Gradle 빌드 블록',
          type: 'step',
          domain: 'gradle',
          task: ['build'],
          description:
            'Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.',
          'job-name': 'job1',
          config: {
            name: 'Gradle Build (no test)',
            run: 'chmod +x ./gradlew\n./gradlew clean build -x test',
          },
        },
        {
          id: 'step-gradle-test',
          name: 'Gradle 테스트 실행 블록',
          type: 'step',
          domain: 'gradle',
          task: ['test'],
          description: 'Gradle을 사용하여 테스트를 수행하는 블록입니다.',
          'job-name': 'job1',
          config: {
            name: 'Test with Gradle',
            run: './gradlew test',
          },
        },
        {
          id: 'step-docker-login',
          name: 'Docker 로그인',
          type: 'step',
          domain: 'docker',
          task: ['login'],
          description: 'Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.',
          'job-name': 'job1',
          config: {
            name: 'Docker Login',
            uses: 'docker/login-action@v2.2.0',
            with: {
              username: '${{ secrets.DOCKER_USERNAME }}',
              password: '${{ secrets.DOCKER_PASSWORD }}',
            },
          },
        },
        {
          id: 'step-docker-build-push',
          name: 'Docker 이미지 빌드 및 푸시 블록',
          type: 'step',
          domain: 'docker',
          task: ['build', 'push'],
          description: 'Docker 이미지를 빌드하고 Docker Hub에 푸시하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'image build and push docker images',
            uses: 'docker/build-push-action@v4.1.1',
            with: {
              context: '.',
              push: true,
              tags: '${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest',
              'no-cache': true,
            },
          },
        },
        {
          id: 'step-aws-deploy',
          name: 'Deploy to AWS EC2',
          type: 'step',
          domain: 'aws',
          task: ['deploy'],
          description: 'Docker 이미지를 EC2 서버에 배포하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Deploy to AWS EC2',
            uses: 'appleboy/ssh-action@v0.1.10',
            with: {
              host: '${{ secrets.AWS_HOST_IP }}',
              username: '${{ secrets.REMOTE_USER }}',
              key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
              port: '${{ secrets.REMOTE_SSH_PORT }}',
              script:
                "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
            },
          },
        },
      ],
      config: {
        name: 'Java CICD',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['v2'],
          },
        },
        jobs: {
          job1: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout repository',
                uses: 'actions/checkout@v4',
              },
              {
                name: 'Set up JDK 21',
                uses: 'actions/setup-java@v4',
                with: {
                  distribution: 'adopt',
                  'java-version': '21',
                },
              },
              {
                name: 'Gradle Build (no test)',
                run: 'chmod +x ./gradlew\n./gradlew clean build -x test',
              },
              {
                name: 'Test with Gradle',
                run: './gradlew test',
              },
              {
                name: 'Docker Login',
                uses: 'docker/login-action@v2.2.0',
                with: {
                  username: '${{ secrets.DOCKER_USERNAME }}',
                  password: '${{ secrets.DOCKER_PASSWORD }}',
                },
              },
              {
                name: 'image build and push docker images',
                uses: 'docker/build-push-action@v4.1.1',
                with: {
                  context: '.',
                  push: true,
                  tags: '${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest',
                  'no-cache': true,
                },
              },
              {
                name: 'Deploy to AWS EC2',
                uses: 'appleboy/ssh-action@v0.1.10',
                with: {
                  host: '${{ secrets.AWS_HOST_IP }}',
                  username: '${{ secrets.REMOTE_USER }}',
                  key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
                  port: '${{ secrets.REMOTE_SSH_PORT }}',
                  script:
                    "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
                },
              },
            ],
          },
        },
      },
      isActive: true,
    },
  ],

  //* CI 파이프라인
  ci: [
    {
      id: 'pipeline-java-ci',
      name: 'Java CI 파이프라인',
      description:
        'Java 프로젝트를 위한 CI 파이프라인입니다. 빌드와 테스트를 포함합니다.',
      type: 'ci',
      domain: 'java',
      task: ['build', 'test'],
      blocks: [
        {
          id: 'trigger-workflow-basic',
          name: '워크플로우 기본 설정',
          type: 'trigger',
          description:
            'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
          config: {
            name: 'Java CI',
            on: {
              workflow_dispatch: {},
              push: {
                branches: ['main'],
              },
              pull_request: {
                branches: ['main'],
              },
            },
          },
        },
        {
          id: 'job-ci-pipeline',
          name: 'CI Pipeline Job',
          type: 'job',
          description: 'CI 파이프라인을 실행하는 Job입니다.',
          'job-name': 'job1',
          config: {
            jobs: {
              job1: {
                'runs-on': 'ubuntu-latest',
              },
            },
          },
        },
        {
          id: 'step-checkout',
          name: 'Checkout repository',
          type: 'step',
          domain: 'github',
          task: ['checkout'],
          description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Checkout repository',
            uses: 'actions/checkout@v4',
          },
        },
        {
          id: 'step-java-setup',
          name: 'Set up JDK 21',
          type: 'step',
          domain: 'java',
          task: ['setup'],
          description:
            'GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Set up JDK 21',
            uses: 'actions/setup-java@v4',
            with: {
              distribution: 'adopt',
              'java-version': '21',
            },
          },
        },
        {
          id: 'step-gradle-build',
          name: 'Gradle 빌드 블록',
          type: 'step',
          domain: 'gradle',
          task: ['build'],
          description:
            'Gradle Wrapper에 권한을 부여하고, 테스트를 제외한 빌드만 수행합니다.',
          'job-name': 'job1',
          config: {
            name: 'Gradle Build (no test)',
            run: 'chmod +x ./gradlew\n./gradlew clean build -x test',
          },
        },
        {
          id: 'step-gradle-test',
          name: 'Gradle 테스트 실행 블록',
          type: 'step',
          domain: 'gradle',
          task: ['test'],
          description: 'Gradle을 사용하여 테스트를 수행하는 블록입니다.',
          'job-name': 'job1',
          config: {
            name: 'Test with Gradle',
            run: './gradlew test',
          },
        },
      ],
      config: {
        name: 'Java CI',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['main'],
          },
          pull_request: {
            branches: ['main'],
          },
        },
        jobs: {
          job1: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout repository',
                uses: 'actions/checkout@v4',
              },
              {
                name: 'Set up JDK 21',
                uses: 'actions/setup-java@v4',
                with: {
                  distribution: 'adopt',
                  'java-version': '21',
                },
              },
              {
                name: 'Gradle Build (no test)',
                run: 'chmod +x ./gradlew\n./gradlew clean build -x test',
              },
              {
                name: 'Test with Gradle',
                run: './gradlew test',
              },
            ],
          },
        },
      },
      isActive: true,
    },
  ],

  //* CD 파이프라인
  cd: [
    {
      id: 'pipeline-docker-deploy',
      name: 'Docker 배포 파이프라인',
      description: 'Docker 이미지를 빌드하고 배포하는 CD 파이프라인입니다.',
      type: 'cd',
      domain: 'docker',
      task: ['build', 'deploy'],
      blocks: [
        {
          id: 'trigger-workflow-basic',
          name: '워크플로우 기본 설정',
          type: 'trigger',
          description:
            'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
          config: {
            name: 'Docker Deploy',
            on: {
              workflow_dispatch: {},
              push: {
                branches: ['production'],
              },
            },
          },
        },
        {
          id: 'job-deploy-pipeline',
          name: 'Deploy Pipeline Job',
          type: 'job',
          description: '배포 파이프라인을 실행하는 Job입니다.',
          'job-name': 'job1',
          config: {
            jobs: {
              job1: {
                'runs-on': 'ubuntu-latest',
              },
            },
          },
        },
        {
          id: 'step-checkout',
          name: 'Checkout repository',
          type: 'step',
          domain: 'github',
          task: ['checkout'],
          description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Checkout repository',
            uses: 'actions/checkout@v4',
          },
        },
        {
          id: 'step-docker-login',
          name: 'Docker 로그인',
          type: 'step',
          domain: 'docker',
          task: ['login'],
          description: 'Docker Hub에 로그인하여 이후 이미지 푸시에 권한을 부여합니다.',
          'job-name': 'job1',
          config: {
            name: 'Docker Login',
            uses: 'docker/login-action@v2.2.0',
            with: {
              username: '${{ secrets.DOCKER_USERNAME }}',
              password: '${{ secrets.DOCKER_PASSWORD }}',
            },
          },
        },
        {
          id: 'step-docker-build-push',
          name: 'Docker 이미지 빌드 및 푸시 블록',
          type: 'step',
          domain: 'docker',
          task: ['build', 'push'],
          description: 'Docker 이미지를 빌드하고 Docker Hub에 푸시하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'image build and push docker images',
            uses: 'docker/build-push-action@v4.1.1',
            with: {
              context: '.',
              push: true,
              tags: '${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest',
              'no-cache': true,
            },
          },
        },
        {
          id: 'step-aws-deploy',
          name: 'Deploy to AWS EC2',
          type: 'step',
          domain: 'aws',
          task: ['deploy'],
          description: 'Docker 이미지를 EC2 서버에 배포하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Deploy to AWS EC2',
            uses: 'appleboy/ssh-action@v0.1.10',
            with: {
              host: '${{ secrets.AWS_HOST_IP }}',
              username: '${{ secrets.REMOTE_USER }}',
              key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
              port: '${{ secrets.REMOTE_SSH_PORT }}',
              script:
                "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
            },
          },
        },
      ],
      config: {
        name: 'Docker Deploy',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['production'],
          },
        },
        jobs: {
          job1: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout repository',
                uses: 'actions/checkout@v4',
              },
              {
                name: 'Docker Login',
                uses: 'docker/login-action@v2.2.0',
                with: {
                  username: '${{ secrets.DOCKER_USERNAME }}',
                  password: '${{ secrets.DOCKER_PASSWORD }}',
                },
              },
              {
                name: 'image build and push docker images',
                uses: 'docker/build-push-action@v4.1.1',
                with: {
                  context: '.',
                  push: true,
                  tags: '${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest',
                  'no-cache': true,
                },
              },
              {
                name: 'Deploy to AWS EC2',
                uses: 'appleboy/ssh-action@v0.1.10',
                with: {
                  host: '${{ secrets.AWS_HOST_IP }}',
                  username: '${{ secrets.REMOTE_USER }}',
                  key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
                  port: '${{ secrets.REMOTE_SSH_PORT }}',
                  script:
                    "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
                },
              },
            ],
          },
        },
      },
      isActive: true,
    },
  ],

  //* 테스트 파이프라인
  test: [
    {
      id: 'pipeline-java-test',
      name: 'Java 테스트 파이프라인',
      description: 'Java 프로젝트를 위한 테스트 전용 파이프라인입니다.',
      type: 'test',
      domain: 'java',
      task: ['test'],
      blocks: [
        {
          id: 'trigger-workflow-basic',
          name: '워크플로우 기본 설정',
          type: 'trigger',
          description:
            'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
          config: {
            name: 'Java Test',
            on: {
              workflow_dispatch: {},
              push: {
                branches: ['main'],
              },
              pull_request: {
                branches: ['main'],
              },
            },
          },
        },
        {
          id: 'job-test-pipeline',
          name: 'Test Pipeline Job',
          type: 'job',
          description: '테스트 파이프라인을 실행하는 Job입니다.',
          'job-name': 'job1',
          config: {
            jobs: {
              job1: {
                'runs-on': 'ubuntu-latest',
              },
            },
          },
        },
        {
          id: 'step-checkout',
          name: 'Checkout repository',
          type: 'step',
          domain: 'github',
          task: ['checkout'],
          description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Checkout repository',
            uses: 'actions/checkout@v4',
          },
        },
        {
          id: 'step-java-setup',
          name: 'Set up JDK 21',
          type: 'step',
          domain: 'java',
          task: ['setup'],
          description:
            'GitHub Actions 실행 환경에 AdoptOpenJDK 21을 설치하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Set up JDK 21',
            uses: 'actions/setup-java@v4',
            with: {
              distribution: 'adopt',
              'java-version': '21',
            },
          },
        },
        {
          id: 'step-gradle-test',
          name: 'Gradle 테스트 실행 블록',
          type: 'step',
          domain: 'gradle',
          task: ['test'],
          description: 'Gradle을 사용하여 테스트를 수행하는 블록입니다.',
          'job-name': 'job1',
          config: {
            name: 'Test with Gradle',
            run: './gradlew test',
          },
        },
      ],
      config: {
        name: 'Java Test',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['main'],
          },
          pull_request: {
            branches: ['main'],
          },
        },
        jobs: {
          job1: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout repository',
                uses: 'actions/checkout@v4',
              },
              {
                name: 'Set up JDK 21',
                uses: 'actions/setup-java@v4',
                with: {
                  distribution: 'adopt',
                  'java-version': '21',
                },
              },
              {
                name: 'Test with Gradle',
                run: './gradlew test',
              },
            ],
          },
        },
      },
      isActive: true,
    },
  ],

  //* 배포 파이프라인
  deploy: [
    {
      id: 'pipeline-aws-deploy',
      name: 'AWS 배포 파이프라인',
      description: 'AWS EC2에 애플리케이션을 배포하는 파이프라인입니다.',
      type: 'deploy',
      domain: 'aws',
      task: ['deploy'],
      blocks: [
        {
          id: 'trigger-workflow-basic',
          name: '워크플로우 기본 설정',
          type: 'trigger',
          description:
            'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
          config: {
            name: 'AWS Deploy',
            on: {
              workflow_dispatch: {},
              push: {
                branches: ['production'],
              },
            },
          },
        },
        {
          id: 'job-deploy-pipeline',
          name: 'Deploy Pipeline Job',
          type: 'job',
          description: '배포 파이프라인을 실행하는 Job입니다.',
          'job-name': 'job1',
          config: {
            jobs: {
              job1: {
                'runs-on': 'ubuntu-latest',
              },
            },
          },
        },
        {
          id: 'step-checkout',
          name: 'Checkout repository',
          type: 'step',
          domain: 'github',
          task: ['checkout'],
          description: 'GitHub 저장소를 체크아웃하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Checkout repository',
            uses: 'actions/checkout@v4',
          },
        },
        {
          id: 'step-aws-deploy',
          name: 'Deploy to AWS EC2',
          type: 'step',
          domain: 'aws',
          task: ['deploy'],
          description: 'Docker 이미지를 EC2 서버에 배포하는 단계입니다.',
          'job-name': 'job1',
          config: {
            name: 'Deploy to AWS EC2',
            uses: 'appleboy/ssh-action@v0.1.10',
            with: {
              host: '${{ secrets.AWS_HOST_IP }}',
              username: '${{ secrets.REMOTE_USER }}',
              key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
              port: '${{ secrets.REMOTE_SSH_PORT }}',
              script:
                "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
            },
          },
        },
      ],
      config: {
        name: 'AWS Deploy',
        on: {
          workflow_dispatch: {},
          push: {
            branches: ['production'],
          },
        },
        jobs: {
          job1: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout repository',
                uses: 'actions/checkout@v4',
              },
              {
                name: 'Deploy to AWS EC2',
                uses: 'appleboy/ssh-action@v0.1.10',
                with: {
                  host: '${{ secrets.AWS_HOST_IP }}',
                  username: '${{ secrets.REMOTE_USER }}',
                  key: '${{ secrets.AWS_EC2_PRIVATE_KEY }}',
                  port: '${{ secrets.REMOTE_SSH_PORT }}',
                  script:
                    "docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}\ndocker pull ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest\ndocker stop bus-notice-v2\ndocker rm $(docker ps --filter 'status=exited' -a -q)\ndocker run -d --name bus-notice-v2 --log-driver=syslog --network bus-notice -p 8081:8080 --label co.elastic.logs/enabled=true --label co.elastic.logs/module=java ${{ secrets.DOCKER_USERNAME }}/bus-notice-v2:latest",
                },
              },
            ],
          },
        },
      },
      isActive: true,
    },
  ],
};

//* ========================================
//* API 시뮬레이션 함수 (나중에 실제 API 호출로 대체)
//* ========================================

//* 프리셋 블록 데이터를 가져오는 함수 (API 호출 시뮬레이션)
export const fetchPresetBlocks = async (): Promise<Record<string, BlockData[]>> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRESETS.BLOCKS}`);

    if (!response.ok) {
      throw new Error(
        `Preset blocks retrieval failed: ${getErrorMessage(response.status)}`,
      );
    }

    const blocks = await response.json();
    //* 백엔드에서 받은 블록들을 탭별로 그룹화
    const groupedBlocks: Record<string, BlockData[]> = {
      trigger: blocks.filter((block: BlockData) => block.type === 'trigger'),
      job: blocks.filter((block: BlockData) => block.type === 'job'),
      step: blocks.filter((block: BlockData) => block.type === 'step'),
    };

    return groupedBlocks;
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(PRESET_BLOCKS);
      }, 100); //* API 호출 시뮬레이션을 위한 지연
    });
  }
};

//* 프리셋 파이프라인 데이터를 가져오는 함수 (API 호출 시뮬레이션)
export const fetchPresetPipelines = async (): Promise<
  Record<string, PresetPipeline[]>
> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRESETS.PIPELINES}`,
    );

    if (!response.ok) {
      throw new Error(
        `Preset pipelines retrieval failed: ${getErrorMessage(response.status)}`,
      );
    }

    const pipelines = await response.json();
    //* 백엔드에서 받은 파이프라인들을 타입별로 그룹화
    const groupedPipelines: Record<string, PresetPipeline[]> = {
      cicd: pipelines.filter((pipeline: any) => pipeline.type === 'cicd'),
      ci: pipelines.filter((pipeline: any) => pipeline.type === 'ci'),
      cd: pipelines.filter((pipeline: any) => pipeline.type === 'cd'),
      test: pipelines.filter((pipeline: any) => pipeline.type === 'test'),
      deploy: pipelines.filter((pipeline: any) => pipeline.type === 'deploy'),
    };

    return groupedPipelines;
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(PRESET_PIPELINES);
      }, 100); //* API 호출 시뮬레이션을 위한 지연
    });
  }
};

//* 특정 탭의 프리셋 블록을 가져오는 함수
export const fetchPresetBlocksByTab = async (tab: string): Promise<BlockData[]> => {
  const allBlocks = await fetchPresetBlocks();
  return allBlocks[tab] || [];
};

//* 특정 탭의 프리셋 파이프라인을 가져오는 함수
export const fetchPresetPipelinesByTab = async (
  tab: string,
): Promise<PresetPipeline[]> => {
  const allPipelines = await fetchPresetPipelines();
  return allPipelines[tab] || [];
};

//* ========================================
//* 백엔드 API와 일치하는 함수들
//* ========================================

//* 실제 API 사용 여부 설정 (환경변수나 설정으로 제어 가능)
const USE_REAL_API = API_CONFIG.USE_REAL_API;

//* 파이프라인 생성 (POST /api/pipelines)
export const createPipeline = async (request: WorkflowRequest): Promise<string> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const token = localStorage.getItem('github_token') || '';
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PIPELINES.CREATE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new Error(`Pipeline creation failed: ${getErrorMessage(response.status)}`);
    }

    return response.text();
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('Workflow conversion and upload on github successful');
      }, 200);
    });
  }
};

//* 파이프라인 조회 (GET /api/pipelines/{ymlFileName})
export const getPipeline = async (
  ymlFileName: string,
  owner: string,
  repo: string,
): Promise<WorkflowResponse> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const token = localStorage.getItem('github_token') || '';
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PIPELINES.GET(ymlFileName, owner, repo)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error(`Pipeline retrieval failed: ${getErrorMessage(response.status)}`);
    }

    return response.json();
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(EXAMPLE_WORKFLOW_RESPONSE);
      }, 200);
    });
  }
};

//* 파이프라인 업데이트 (PUT /api/pipelines)
export const updatePipeline = async (
  request: WorkflowRequest,
): Promise<WorkflowResponse> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const token = localStorage.getItem('github_token') || '';
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PIPELINES.UPDATE}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new Error(`Pipeline update failed: ${getErrorMessage(response.status)}`);
    }

    return response.json();
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          workflowId: 'updated-id',
          workflowName: request.workflowName,
          originalJson: request.inputJson,
          success: true,
          message: 'Workflow updated successfully',
        });
      }, 200);
    });
  }
};

//* 파이프라인 삭제 (DELETE /api/pipelines/{ymlFileName})
export const deletePipeline = async (
  ymlFileName: string,
  owner: string,
  repo: string,
): Promise<void> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const token = localStorage.getItem('github_token') || '';
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PIPELINES.DELETE(ymlFileName, owner, repo)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error(`Pipeline deletion failed: ${getErrorMessage(response.status)}`);
    }
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });
  }
};

//* 프리셋 블록 조회 (GET /api/presets/blocks)
export const getPresetBlocks = async (): Promise<BlockData[]> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRESETS.BLOCKS}`);

    if (!response.ok) {
      throw new Error(
        `Preset blocks retrieval failed: ${getErrorMessage(response.status)}`,
      );
    }

    return response.json();
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        const allBlocks = Object.values(PRESET_BLOCKS).flat();
        resolve(allBlocks);
      }, 200);
    });
  }
};

//* 프리셋 파이프라인 조회 (GET /api/presets/pipelines)
export const getPresetPipelines = async (): Promise<WorkflowResponse[]> => {
  if (USE_REAL_API) {
    //* 실제 백엔드 API 호출
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRESETS.PIPELINES}`,
    );

    if (!response.ok) {
      throw new Error(
        `Preset pipelines retrieval failed: ${getErrorMessage(response.status)}`,
      );
    }

    return response.json();
  } else {
    //* 목 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([EXAMPLE_WORKFLOW_RESPONSE]);
      }, 200);
    });
  }
};
