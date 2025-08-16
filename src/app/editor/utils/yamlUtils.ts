// * YAML 파싱/포맷 공통 유틸
import YAML from 'yaml';

export type YamlParseResult = {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
};

export const parseYamlToConfigStrict = (yamlText: string): YamlParseResult => {
  try {
    // YAML -> JS 객체
    const parsed = YAML.parse(yamlText ?? '');
    if (parsed === null || parsed === undefined) {
      return { success: true, data: {} };
    }
    if (typeof parsed !== 'object') {
      return { success: false, error: 'YAML 최상위 구조는 객체여야 합니다.' };
    }
    return { success: true, data: parsed as Record<string, unknown> };
  } catch (err: any) {
    return { success: false, error: err?.message || 'YAML 파싱 오류가 발생했습니다.' };
  }
};

export const formatYaml = (yamlText: string): string => {
  const result = parseYamlToConfigStrict(yamlText);
  if (!result.success || !result.data) return yamlText;
  try {
    return YAML.stringify(result.data, { indent: 2 });
  } catch {
    return yamlText;
  }
};

export const stringifyYaml = (data: unknown): string => {
  try {
    return YAML.stringify(data ?? {}, { indent: 2 });
  } catch {
    return '';
  }
};
