//* ========================================
//* YAML 생성 유틸리티
//* ========================================
//* 이 파일은 서버 블록 데이터를 GitHub Actions YAML 형식으로 변환합니다.
//* 단일 블록의 YAML과 전체 워크플로우 YAML을 생성할 수 있습니다.

import { ServerBlock } from '../types';

// 내부 유틸: job-id 생성 (공백→하이픈, 소문자, 안전 문자만 유지)
const toJobId = (raw: string) =>
  (raw || 'job')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

//* ========================================
//* 단일 블록 YAML 생성
//* ========================================

//* 단일 블록을 YAML로 변환 (config 내용만 사용)
//? 블록 타입에 따라 적절한 YAML 구조를 생성
export const generateBlockYaml = (block: ServerBlock): string => {
  const yamlLines: string[] = [];

  // config가 없으면 빈 문자열 반환
  if (!block || !block.config) {
    return '# 설정이 없습니다.';
  }

  //* ========================================
  //* 트리거 블록 YAML 생성
  //* ========================================
  if (block.type === 'trigger') {
    //* config 내용만 사용하여 YAML 생성
    Object.entries(block.config).forEach(([key, value]) => {
      if (typeof value === 'string') {
        yamlLines.push(`${key}: ${value}`);
      } else if (typeof value === 'object' && value !== null) {
        yamlLines.push(`${key}:`);
        if (Array.isArray(value)) {
          value.forEach((item: unknown) => {
            if (typeof item === 'string') {
              yamlLines.push(`  - ${item}`);
            } else if (typeof item === 'object' && item !== null) {
              Object.entries(item as Record<string, unknown>).forEach(([k, v]) => {
                if (typeof v === 'string') {
                  yamlLines.push(`    ${k}: ${v}`);
                } else {
                  yamlLines.push(`    ${k}: ${JSON.stringify(v)}`);
                }
              });
            }
          });
        } else {
          Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
            if (typeof v === 'string') {
              yamlLines.push(`  ${k}: ${v}`);
            } else if (typeof v === 'object' && v !== null) {
              yamlLines.push(`  ${k}:`);
              Object.entries(v as Record<string, unknown>).forEach(([subK, subV]) => {
                if (typeof subV === 'string') {
                  yamlLines.push(`    ${subK}: ${subV}`);
                } else {
                  yamlLines.push(`    ${subK}: ${JSON.stringify(subV)}`);
                }
              });
            } else {
              yamlLines.push(`  ${k}: ${JSON.stringify(v)}`);
            }
          });
        }
      }
    });
  }

  //* ========================================
  //* Job 블록 YAML 생성 (평탄화된 config 기반)
  //* ========================================
  else if (block.type === 'job') {
    const jobConfig = (block.config || {}) as Record<string, unknown>;
    if (!jobConfig || Object.keys(jobConfig).length === 0) {
      yamlLines.push('# Job 설정이 없습니다.');
    } else {
      Object.entries(jobConfig).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          yamlLines.push(`${key}: ${value}`);
        } else if (Array.isArray(value)) {
          yamlLines.push(`${key}:`);
          value.forEach((item) => {
            if (typeof item === 'string') {
              yamlLines.push(`  - ${item}`);
            } else {
              yamlLines.push(`  - ${JSON.stringify(item)}`);
            }
          });
        } else if (value && typeof value === 'object') {
          yamlLines.push(`${key}:`);
          Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
            if (
              typeof v === 'string' ||
              typeof v === 'number' ||
              typeof v === 'boolean'
            ) {
              yamlLines.push(`  ${k}: ${v}`);
            } else {
              yamlLines.push(`  ${k}: ${JSON.stringify(v)}`);
            }
          });
        } else {
          yamlLines.push(`${key}: ${JSON.stringify(value)}`);
        }
      });
    }
  }

  //* ========================================
  //* Step 블록 YAML 생성
  //* ========================================
  else if (block.type === 'step') {
    //* config 내용만 사용하여 YAML 생성
    if (!block.config || Object.keys(block.config).length === 0) {
      yamlLines.push('# Step 설정이 없습니다.');
    } else {
      Object.entries(block.config).forEach(([key, value]) => {
        if (typeof value === 'string') {
          yamlLines.push(`${key}: ${value}`);
        } else if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            yamlLines.push(`${key}:`);
            value.forEach((item: unknown) => {
              if (typeof item === 'string') {
                yamlLines.push(`  - ${item}`);
              } else {
                yamlLines.push(`  - ${JSON.stringify(item)}`);
              }
            });
          } else {
            yamlLines.push(`${key}:`);
            Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
              if (typeof v === 'string') {
                yamlLines.push(`  ${k}: ${v}`);
              } else {
                yamlLines.push(`  ${k}: ${JSON.stringify(v)}`);
              }
            });
          }
        } else {
          yamlLines.push(`${key}: ${JSON.stringify(value)}`);
        }
      });
    }
  }

  return yamlLines.join('\n');
};

//* ========================================
//* 전체 워크플로우 YAML 생성
//* ========================================

//* 전체 블록들을 완전한 YAML로 변환
//! 모든 블록을 올바른 계층 구조로 조합하여 완전한 GitHub Actions YAML 생성
export const generateFullYaml = (blocks: ServerBlock[]): string => {
  const yamlLines: string[] = [];

  // blocks가 없으면 빈 문자열 반환
  if (!blocks || blocks.length === 0) {
    return '# 워크플로우가 구성되지 않았습니다.';
  }

  //* ========================================
  //* 트리거 블록 처리
  //* ========================================
  const triggerBlock = blocks.find((block) => block.type === 'trigger');
  if (triggerBlock) {
    const triggerYaml = generateBlockYaml(triggerBlock);
    yamlLines.push(triggerYaml);
    // 커스텀 메타 필드 (루트)
    if (triggerBlock.name) {
      yamlLines.push(`x_name: ${triggerBlock.name}`);
    }
    if (triggerBlock.description) {
      yamlLines.push(`x_description: ${triggerBlock.description}`);
    }
    yamlLines.push('');
  }

  //* ========================================
  //* Job 블록들 처리
  //* ========================================
  const jobBlocks = blocks.filter((block) => block.type === 'job');
  if (jobBlocks.length > 0) {
    yamlLines.push('jobs:');

    jobBlocks.forEach((jobBlock, index) => {
      const jobId = (jobBlock['job-name'] as string) || toJobId(jobBlock.name);
      const jobData = (jobBlock.config || {}) as Record<string, unknown>;

      if (jobId && jobData) {
        yamlLines.push(`${jobId}:`);

        //* runs-on 설정
        if (jobData['runs-on']) {
          yamlLines.push(`  runs-on: ${jobData['runs-on']}`);
        }

        //* needs 설정
        if (jobData.needs && Array.isArray(jobData.needs) && jobData.needs.length > 0) {
          yamlLines.push('  needs:');
          jobData.needs.forEach((need: unknown) => {
            if (typeof need === 'string') {
              yamlLines.push(`    - ${need}`);
            }
          });
        }

        //* if 조건 설정
        if (jobData.if && typeof jobData.if === 'string') {
          yamlLines.push(`  if: ${jobData.if}`);
        }

        //* timeout 설정
        if (jobData.timeout && typeof jobData.timeout === 'number') {
          yamlLines.push(`  timeout-minutes: ${jobData.timeout}`);
        }

        //* 커스텀 메타 필드 (Job)
        if (jobBlock.name) {
          yamlLines.push(`  x_name: ${jobBlock.name}`);
        }
        if (jobBlock.description) {
          yamlLines.push(`  x_description: ${jobBlock.description}`);
        }

        //* ========================================
        //* 해당 Job의 Step들 처리 (job-name으로 연결)
        //* ========================================
        // job-id를 사용하여 step들을 찾음
        const jobNameForSteps = jobId;
        const stepBlocks = blocks.filter(
          (block) => block.type === 'step' && block['job-name'] === jobNameForSteps,
        );

        if (stepBlocks.length > 0) {
          yamlLines.push('  steps:');
          stepBlocks.forEach((stepBlock) => {
            const stepConfig = (stepBlock.config || {}) as Record<string, unknown>;
            const stepName = (stepConfig.name as string) || stepBlock.name || '';
            yamlLines.push(`    - name: ${stepName}`);
            // 커스텀 메타 필드 (Step)
            if (stepBlock.name) {
              yamlLines.push(`      x_name: ${stepBlock.name}`);
            }
            if (stepBlock.description) {
              yamlLines.push(`      x_description: ${stepBlock.description}`);
            }
            if (stepBlock.domain) {
              yamlLines.push(`      x_domain: ${stepBlock.domain}`);
            }
            if (Array.isArray(stepBlock.task) && stepBlock.task.length > 0) {
              yamlLines.push('      x_task:');
              stepBlock.task.forEach((t) => yamlLines.push(`        - ${t}`));
            }

            // 나머지 config를 출력 (name 중복 제외)
            Object.entries(stepConfig).forEach(([k, v]) => {
              if (k === 'name') return;
              if (
                typeof v === 'string' ||
                typeof v === 'number' ||
                typeof v === 'boolean'
              ) {
                yamlLines.push(`      ${k}: ${v}`);
              } else if (Array.isArray(v)) {
                yamlLines.push(`      ${k}:`);
                (v as unknown[]).forEach((item) => {
                  if (typeof item === 'string') {
                    yamlLines.push(`        - ${item}`);
                  } else {
                    yamlLines.push(`        - ${JSON.stringify(item)}`);
                  }
                });
              } else if (v && typeof v === 'object') {
                yamlLines.push(`      ${k}:`);
                Object.entries(v as Record<string, unknown>).forEach(([sk, sv]) => {
                  if (
                    typeof sv === 'string' ||
                    typeof sv === 'number' ||
                    typeof sv === 'boolean'
                  ) {
                    yamlLines.push(`        ${sk}: ${sv}`);
                  } else {
                    yamlLines.push(`        ${sk}: ${JSON.stringify(sv)}`);
                  }
                });
              }
            });
          });
        }

        //* 추가 Job 설정들 (이미 처리한 키 제외)
        Object.entries(jobData).forEach(([key, value]) => {
          if (!['runs-on', 'needs', 'if', 'timeout', 'steps'].includes(key)) {
            if (typeof value === 'string') {
              yamlLines.push(`  ${key}: ${value}`);
            } else {
              yamlLines.push(`  ${key}: ${JSON.stringify(value)}`);
            }
          }
        });

        if (index < jobBlocks.length - 1) {
          yamlLines.push('');
        }
      }
    });
  }

  return yamlLines.join('\n');
};
