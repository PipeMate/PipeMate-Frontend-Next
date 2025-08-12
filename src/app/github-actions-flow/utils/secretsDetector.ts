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
export const extractSecretsFromObject = (obj: any): string[] => {
  const secrets: string[] = [];

  const traverse = (value: any) => {
    if (typeof value === "string") {
      secrets.push(...extractSecretsFromString(value));
    } else if (Array.isArray(value)) {
      value.forEach(traverse);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(traverse);
    }
  };

  traverse(obj);
  return [...new Set(secrets)]; // 중복 제거
};

// * 사용자 secrets 목록과 비교하여 누락된 secrets 찾기
export const findMissingSecrets = (
  requiredSecrets: string[],
  userSecrets: string[]
): string[] => {
  return requiredSecrets.filter((secret) => !userSecrets.includes(secret));
};

// * Config에서 secrets 감지
export const detectSecretsInConfig = (config: any): string[] => {
  return extractSecretsFromObject(config);
};

// * NodeType이 secrets를 사용할 수 있는지 확인
export const canNodeUseSecrets = (nodeType: string): boolean => {
  // step 타입의 노드만 secrets를 사용할 수 있음
  return nodeType === "step";
};
