import {
  Github,
  Home,
  Workflow,
  Blocks,
  FileText,
  Play,
  Eye,
  Monitor,
} from 'lucide-react';

// * 아이콘 타입 정의
type IconType = React.ComponentType<{ className?: string }>;

// * 라우트 아이템 타입 정의
interface RouteItem {
  url: string;
  label: string;
  icon: IconType;
}

// * 브랜드 정보
export const BRAND = {
  name: 'PipeMate',
  description: '워크플로우 에디터',
  logo: {
    icon: Workflow,
    color: 'text-blue-600',
  },
} as const;

// * 라우트 정보
export const ROUTES: Record<string, RouteItem> = {
  HOME: {
    url: '/',
    label: '대시보드',
    icon: Home,
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
  ACTION_FLOW: {
    url: '/github-actions-flow',
    label: '워크플로우 에디터',
    icon: Github,
  },
} as const;

// * 홈 페이지 정보
export const HOME = {
  hero: {
    title: '블록으로 쉽게 만드는 GitHub Actions 워크플로우',
  },
  features: [
    {
      icon: Github,
      title: 'GitHub 연동',
      description:
        'GitHub 계정과 연결하여 저장소의 워크플로우를 직접 관리하고 실행할 수 있습니다.',
      color: 'text-gray-700',
    },
    {
      icon: Blocks,
      title: '블록 기반 편집기',
      description:
        '드래그 앤 드롭으로 워크플로우를 구성하세요. 복잡한 YAML 문법을 몰라도 쉽게 만들 수 있습니다.',
      color: 'text-blue-600',
    },
    {
      icon: FileText,
      title: 'YAML 자동 생성',
      description:
        '블록을 조합하면 완벽한 GitHub Actions YAML 파일이 자동으로 생성됩니다.',
      color: 'text-green-600',
    },
    {
      icon: Play,
      title: 'Action API 실행',
      description: '생성된 워크플로우를 GitHub Actions API로 원클릭 실행할 수 있습니다.',
      color: 'text-purple-600',
    },
    {
      icon: Eye,
      title: '시각적 미리보기',
      description: '실행 전 워크플로우 구조를 한눈에 확인하고 검증할 수 있습니다.',
      color: 'text-orange-600',
    },
  ],
  cta: {
    title: '지금 블록으로 워크플로우를 만들어보세요',
    description:
      '복잡한 YAML 문법을 몰라도 됩니다. 블록을 조합하여 워크플로우를 만들고 GitHub Actions API로 실행해보세요.',
    button: '워크플로우 만들기 시작',
    url: ROUTES.ACTION_FLOW.url,
  },
} as const;

// * 파일 정보 (예시 데이터)
export const FILES = {
  changes: [
    {
      file: 'README.md',
      state: 'M',
    },
    {
      file: 'api/hello/route.ts',
      state: 'U',
    },
    {
      file: 'app/layout.tsx',
      state: 'M',
    },
  ],
  tree: [
    [
      'app',
      [
        'api',
        ['hello', ['route.ts']],
        'page.tsx',
        'layout.tsx',
        ['blog', ['page.tsx']],
        ['blockly', ['page.tsx']],
        ['github-actions-flow', ['page.tsx']],
      ],
    ],
    ['components', ['ui', 'button.tsx', 'card.tsx'], 'header.tsx', 'footer.tsx'],
    ['lib', ['util.ts']],
    ['public', 'favicon.ico', 'vercel.svg'],
    '.eslintrc.json',
    '.gitignore',
    'next.config.js',
    'tailwind.config.js',
    'package.json',
    'README.md',
  ],
} as const;

// * 쿠키 저장소 명
export const STORAGES = {
  GITHUB_TOKEN: 'github token',
  REPOSITORY_OWNER: 'repository owner',
  REPOSITORY_NAME: 'repository name',
} as const;

// * 편의를 위한 유틸리티 상수들
export const ROUTE_URLS = Object.values(ROUTES).map((route) => route.url);
export const ROUTE_LABELS = Object.values(ROUTES).map((route) => route.label);
export const CHANGED_FILES = FILES.changes.map((file) => file.file);
export const FILE_STATES = FILES.changes.map((file) => file.state);

// * 브랜드 관련 편의 export
export const BRAND_NAME = BRAND.name;
export const BRAND_DESCRIPTION = BRAND.description;
export const BRAND_LOGO = BRAND.logo;
