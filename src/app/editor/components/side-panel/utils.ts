import type { SecretFormData } from './types';

// * 그룹 추출 함수 - 시크릿 이름에서 그룹명을 추출
export const extractGroup = (secretName: string): string => {
  if (!secretName) return 'UNKNOWN';
  const parts = secretName.split('_');
  return parts.length > 1 ? parts[0] : 'UNKNOWN';
};

// * 날짜 포맷팅 함수
export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '날짜 없음';
  }
};

// * 시크릿 그룹핑 함수
export const groupSecrets = (secrets: SecretFormData[]) => {
  const groups: { [key: string]: { secret: SecretFormData; index: number }[] } = {};

  secrets.forEach((secret, index) => {
    const group = extractGroup(secret.name);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push({ secret, index });
  });

  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

// * Config 필드 파싱 (재귀적으로 중첩 객체 처리)
export const parseConfigFields = (
  config: Record<string, unknown> | undefined | null,
): any[] => {
  const fields: any[] = [];

  // * config가 없거나 빈 객체인 경우 빈 배열 반환
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return fields;
  }

  Object.entries(config).forEach(([key, value]) => {
    let type: 'string' | 'object' | 'array' = 'string';
    let children: any[] | undefined;

    if (Array.isArray(value)) {
      type = 'array';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      type = 'object';
      children = parseConfigFields(value as Record<string, unknown>);
    }

    fields.push({
      key,
      value: value as string | object | string[],
      type,
      isExpanded: true,
      children,
    });
  });

  return fields;
};

// * 타입별 고정 라벨 정의
export const getFixedLabels = (type: string) => {
  switch (type) {
    case 'workflowTrigger':
      return {
        name: '워크플로우 기본 설정',
        description:
          'GitHub Actions 워크플로우 이름과 트리거 조건을 설정하는 블록입니다.',
      };
    case 'job':
      return {
        name: 'Job 설정',
        description: 'GitHub Actions Job의 기본 설정을 구성합니다.',
      };
    case 'step':
      return {
        name: 'Step 설정',
        description: 'GitHub Actions Step의 실행 명령어와 설정을 구성합니다.',
      };
    default:
      return {
        name: '노드 설정',
        description: '노드의 설정을 구성합니다.',
      };
  }
};
