// * Secrets 패턴 감지 및 처리 유틸리티

// * Secrets 패턴 정규식
const SECRETS_PATTERN = /\$\{\{\s*secrets\.([^}]+)\s*\}\}/g;

// * 문자열에서 secrets 참조 추출
export const extractSecretsFromString = (text: string): string[] => {
  const secrets: string[] = [];
  let match;

  while ((match = SECRETS_PATTERN.exec(text)) !== null) {
    secrets.push(match[1].trim());
  }

  return [...new Set(secrets)]; // 중복 제거
};

// * 객체에서 secrets 참조 추출 (재귀적으로)
export const extractSecretsFromObject = (obj: unknown): string[] => {
  const secrets: string[] = [];

  const traverse = (value: unknown) => {
    if (typeof value === 'string') {
      secrets.push(...extractSecretsFromString(value));
    } else if (Array.isArray(value)) {
      value.forEach(traverse);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(traverse);
    }
  };

  traverse(obj);
  return [...new Set(secrets)]; // 중복 제거
};

// * 사용자 secrets 목록과 비교하여 누락된 secrets 찾기
export const findMissingSecrets = (
  requiredSecrets: string[],
  userSecrets: string[],
): string[] => {
  return requiredSecrets.filter((secret) => !userSecrets.includes(secret));
};

// * Config에서 secrets 감지
export const detectSecretsInConfig = (config: unknown): string[] => {
  return extractSecretsFromObject(config);
};

// * NodeType이 secrets를 사용할 수 있는지 확인
export const canNodeUseSecrets = (nodeType: string): boolean => {
  // step과 job 타입의 노드에서 secrets를 사용할 수 있음
  return nodeType === 'step' || nodeType === 'job';
};

// * 필드가 시크릿 값인지 확인
export const isSecretField = (value: string): boolean => {
  if (typeof value !== 'string') return false;
  return /^\s*\$\{\{\s*secrets\./i.test(value);
};

// * 시크릿 이름 추출
export const extractSecretName = (secretValue: string): string | null => {
  const match = secretValue.match(/\$\{\{\s*secrets\.([^}]+)\s*\}\}/);
  return match ? match[1].trim() : null;
};

// * 시크릿 값 생성
export const createSecretValue = (secretName: string): string => {
  return `\${{ secrets.${secretName} }}`;
};

// * 시크릿이 필요할 가능성이 있는 필드명 패턴
const SECRET_FIELD_PATTERNS = [
  /^.*token.*$/i,
  /^.*key.*$/i,
  /^.*password.*$/i,
  /^.*secret.*$/i,
  /^.*api.*$/i,
  /^.*auth.*$/i,
  /^.*credential.*$/i,
  /^.*private.*$/i,
];

// * 필드명이 시크릿을 사용할 가능성이 있는지 확인
export const isLikelySecretField = (fieldName: string): boolean => {
  return SECRET_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
};

// * 시크릿 사용 권장 필드 감지
export const suggestSecretFields = (config: unknown): string[] => {
  const suggestions: string[] = [];

  const traverse = (obj: unknown, parentKey = '') => {
    if (typeof obj === 'string') {
      if (isLikelySecretField(parentKey) && !isSecretField(obj)) {
        suggestions.push(parentKey);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${parentKey}[${index}]`));
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        traverse(value, fullKey);
      });
    }
  };

  traverse(config);
  return [...new Set(suggestions)];
};
