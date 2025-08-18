import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
    ],
  },
  // Next.js + TypeScript 기본 권장 설정과 Prettier 호환 설정, TanStack Query 권장 룰 적용
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:@tanstack/query/recommended',
    'prettier',
  ),
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 안전한 리팩토링 중심의 경고 및 자동수정
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      // 임포트 내 멤버 정렬 (선언 간 정렬은 유지)
      'sort-imports': [
        'warn',
        { ignoreDeclarationSort: true, allowSeparatedGroups: true },
      ],
      // React 관련 안전 자동수정
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      // 일반 안전 자동수정
      'prefer-const': ['warn', { destructuring: 'all' }],
      'no-var': 'warn',
      'object-shorthand': ['warn', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // 주석 스타일: // *, // !, // ? 접두 허용
      'spaced-comment': [
        'warn',
        'always',
        {
          markers: ['*', '!', '?'],
          exceptions: ['*', '!', '?'],
        },
      ],
      // React Hooks
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
