# API 구조

이 디렉토리는 백엔드 API와의 통신을 위한 클라이언트 코드를 포함합니다.

## 구조

```text
src/api/
├── index.ts              # 기본 API 클라이언트 설정
├── githubClient.ts       # GitHub 전용 클라이언트 (토큰 인터셉터 포함)
├── types/                # 공통 타입 정의
│   └── index.ts
├── pipeline/             # 파이프라인 관련 API
│   └── index.ts
├── workflow/             # GitHub Workflow 관련 API
│   └── index.ts
├── secrets/              # GitHub Secrets 관련 API
│   └── index.ts
└── blocks/               # 블록 관련 API
    └── index.ts
```

## 사용법

### 기본 사용법

```typescript
import { pipelineAPI, workflowAPI, secretsAPI, blockAPI } from '@/api';

// 파이프라인 API 사용
const result = await pipelineAPI.get('workflow-name', 'owner', 'repo');

// 워크플로우 API 사용
const workflows = await workflowAPI.getList('owner', 'repo');

// 시크릿 API 사용
const secrets = await secretsAPI.getList('owner', 'repo');

// 블록 API 사용
const blocks = await blockAPI.getAll();
```

### 타입 사용법

```typescript
import { PipelineRequest, WorkflowItem, BlockResponse } from '@/api';

const request: PipelineRequest = {
  owner: 'username',
  repo: 'repository',
  workflowName: 'workflow.yml',
  inputJson: [],
  description: '설명',
};
```

## API 모듈별 기능

### Pipeline API (`/api/pipeline`)

- `create()` - 파이프라인 생성
- `get()` - 파이프라인 조회
- `update()` - 파이프라인 업데이트
- `delete()` - 파이프라인 삭제

### Workflow API (`/api/workflow`)

- `getList()` - 워크플로우 목록 조회
- `getDetail()` - 워크플로우 상세 정보 조회
- `getRuns()` - 워크플로우 실행 목록 조회
- `getRunDetail()` - 워크플로우 실행 상세 정보 조회
- `getRunLogs()` - 워크플로우 실행 로그 조회
- `getRunJobs()` - 워크플로우 실행의 모든 Job 조회
- `getJobDetail()` - 특정 Job 상세 정보 조회
- `dispatch()` - 워크플로우 수동 실행
- `cancelRun()` - 워크플로우 실행 취소

### Secrets API (`/api/secrets`)

- `getList()` - 시크릿 목록 조회 (기본)
- `getGroupedList()` - 시크릿 그룹화된 목록 조회
- `createOrUpdate()` - 시크릿 생성/수정
- `getPublicKey()` - 퍼블릭 키 조회
- `delete()` - 시크릿 삭제

### Blocks API (`/api/blocks`)

- `getAll()` - 모든 블록 조회

## 특징

1. **토큰 자동 처리**: GitHub Personal Access Token이 자동으로 요청 헤더에 포함됩니다.
2. **파일명 처리**: `.yml` 확장자 중복 문제를 자동으로 해결합니다.
3. **타입 안전성**: TypeScript를 사용하여 타입 안전성을 보장합니다.
4. **모듈화**: 기능별로 분리되어 유지보수가 용이합니다.
