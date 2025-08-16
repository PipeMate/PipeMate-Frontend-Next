import {
  Github,
  Home,
  Workflow,
  Blocks,
  FileText,
  Play,
  Eye,
  Monitor,
  Shapes,
  Shield,
} from 'lucide-react';

// * 브랜드 정보
export const BRAND = {
  name: 'PipeMate',
  description: '블록으로 간편하게 파이프라인 구축',
  logo: {
    icon: Workflow,
    color: 'text-blue-600',
  },
} as const;

// * 라우트 정보
export const ROUTES = {
  HOME: {
    url: '/',
    label: '홈',
    icon: Home,
  },
  ACTION_FLOW: {
    url: '/editor',
    label: '워크플로우 에디터',
    icon: Shapes,
  },
  WORKFLOWS: {
    url: '/workflows',
    label: '워크플로우 관리',
    icon: Workflow,
  },
  MONITORING: {
    url: '/monitoring',
    label: '로그 모니터링',
    icon: Monitor,
  },
} as const;

// * 홈 페이지 정보
export const HOME = {
  hero: {
    title: 'PipeMate',
    subTitle: '블록으로 간편하게 파이프라인 구축',
    description:
      'CI/CD 워크플로우에 대한 사전 지식이 없어도 괜찮습니다. 블록을 이용하여 파이프라인을 구축하고, 실시간으로 실행 상태를 확인하세요. 누구나 손쉽게 효율적인 개발 환경을 경험할 수 있습니다.',
    image: {
      src: '/워크플로우에디터_샘플.png',
      alt: 'PipeMate 워크플로우 에디터 미리보기',
    },
  },
  features: [
    {
      icon: Workflow,
      title: '직관적인 워크플로우 설계',
      description:
        '드래그 앤 드롭으로 Trigger, Job, Step 블록을 연결하여 워크플로우를 시각적으로 설계합니다. 복잡한 YAML 문법 없이도 파이프라인의 구조를 한눈에 파악할 수 있어요.',
      color: 'text-blue-600',
      action: {
        title: '에디터 시작하기',
        url: ROUTES.ACTION_FLOW.url,
        color: 'bg-blue-600 hover:bg-blue-700',
      },
    },
    {
      icon: Monitor,
      title: '실시간 실행 시각화',
      description:
        '구축한 워크플로우의 실행 과정을 실시간으로 모니터링하고, 각 단계별 로그와 성공/실패 여부를 시각화된 화면에서 한눈에 파악할 수 있어 문제 해결이 빠릅니다.',
      color: 'text-green-600',
      action: {
        title: '모니터링 보기',
        url: ROUTES.MONITORING.url,
        color: 'bg-green-600 hover:bg-green-700',
      },
    },
    {
      icon: Shield,
      title: '안전한 보안 관리',
      description:
        '민감한 개인 정보를 GitHub Secret과 연동하여 안전하게 관리합니다. Docker 로그인, AWS 배포 등 보안이 중요한 작업도 워크플로우 블록에서 간편하게 활용할 수 있어요.',
      color: 'text-orange-600',
      action: {
        title: '관리하기',
        url: ROUTES.WORKFLOWS.url,
        color: 'bg-orange-600 hover:bg-orange-700',
      },
    },
  ],
  cta: {
    title: '지금 바로 워크플로우를 만들어보세요!',
    description:
      'PipeMate와 함께라면, 복잡한 CI/CD 개념에 얽매이지 않고 오직 개발에만 집중할 수 있습니다.',
    button: '에디터 시작하기',
    url: ROUTES.ACTION_FLOW.url,
  },
} as const;

// * 쿠키 저장소 명
export const STORAGES = {
  GITHUB_TOKEN: 'github token',
  REPOSITORY_OWNER: 'repository owner',
  REPOSITORY_NAME: 'repository name',
} as const;
