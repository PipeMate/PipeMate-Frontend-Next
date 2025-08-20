// * YAML 생성 유틸리티

// * 이 파일은 서버 블록 데이터를 GitHub Actions YAML 형식으로 변환합니다.
// * 단일 블록의 YAML과 전체 워크플로우 YAML을 생성할 수 있습니다.

import type { ServerBlock } from '../types';
import { stringifyYaml } from './yamlUtils';

// * 내부 유틸: job-id 생성 (공백→하이픈, 소문자, 안전 문자만 유지)
const toJobId = (raw: string) =>
  (raw || 'job')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

// * 기존 데이터 변환

// * 기존 워크플로우 데이터를 개선된 형태로 변환
// ? 기존 YAML 구조를 새로운 블록 기반 구조로 변환
export const convertLegacyWorkflow = (legacyYaml: any): ServerBlock[] => {
  const blocks: ServerBlock[] = [];

  // * Trigger 블록 생성
  if (legacyYaml.on) {
    blocks.push({
      id: `trigger-${Date.now()}`,
      name: legacyYaml.x_name || '워크플로우 트리거',
      type: 'trigger',
      domain: 'github',
      task: ['trigger'],
      description: legacyYaml.x_description || 'GitHub Actions 워크플로우 트리거',
      config: {
        name: legacyYaml.name || 'CI',
        on: legacyYaml.on,
      },
    });
  }

  // * Jobs 블록들 생성
  if (legacyYaml.jobs && typeof legacyYaml.jobs === 'object') {
    Object.entries(legacyYaml.jobs).forEach(([jobId, jobConfig]: [string, any]) => {
      if (typeof jobConfig === 'object' && jobConfig !== null) {
        // * Job 블록 생성
        const jobBlock: ServerBlock = {
          id: `job-${jobId}-${Date.now()}`,
          name: jobConfig.x_name || jobId,
          type: 'job',
          domain: 'github',
          task: ['job'],
          description: jobConfig.x_description || `${jobId} 작업`,
          jobName: jobId,
          config: {
            'runs-on': jobConfig['runs-on'] || 'ubuntu-latest',
            ...(jobConfig.needs && { needs: jobConfig.needs }),
            ...(jobConfig.if && { if: jobConfig.if }),
            ...(jobConfig.timeout && { timeout: jobConfig.timeout }),
          },
        };
        blocks.push(jobBlock);

        // * Steps 블록들 생성
        if (jobConfig.steps && Array.isArray(jobConfig.steps)) {
          jobConfig.steps.forEach((stepConfig: any, stepIndex: number) => {
            if (typeof stepConfig === 'object' && stepConfig !== null) {
              const stepBlock: ServerBlock = {
                id: `step-${jobId}-${stepIndex}-${Date.now()}`,
                name: stepConfig.x_name || stepConfig.name || `Step ${stepIndex + 1}`,
                type: 'step',
                domain: stepConfig.x_domain || 'github',
                task: stepConfig.x_task || ['step'],
                description: stepConfig.x_description || '워크플로우 단계',
                jobName: jobId,
                config: {
                  name: stepConfig.name || stepConfig.x_name || `Step ${stepIndex + 1}`,
                  ...(stepConfig.uses && { uses: stepConfig.uses }),
                  ...(stepConfig.run && { run: stepConfig.run }),
                  ...(stepConfig.with && { with: stepConfig.with }),
                  ...(stepConfig.env && { env: stepConfig.env }),
                  ...(stepConfig.if && { if: stepConfig.if }),
                  ...(stepConfig['continue-on-error'] && {
                    'continue-on-error': stepConfig['continue-on-error'],
                  }),
                },
              };
              blocks.push(stepBlock);
            }
          });
        }
      }
    });
  }

  return blocks;
};

// * 단일 블록 YAML 생성

// * 단일 블록을 YAML로 변환 (config 내용만 사용)
// ? 블록 타입에 따라 적절한 YAML 구조를 생성
export const generateBlockYaml = (block: ServerBlock): string => {
  if (!block || !block.config || Object.keys(block.config).length === 0) {
    return '# 설정이 없습니다.';
  }
  // * config 객체를 YAML 문자열로 안전하게 직렬화 (자동 들여쓰기)
  return stringifyYaml(block.config);
};

// * 전체 워크플로우 YAML 생성

// * 전체 블록들을 완전한 YAML로 변환
// ! 모든 블록을 올바른 계층 구조로 조합하여 완전한 GitHub Actions YAML 생성
export const generateFullYaml = (blocks: ServerBlock[]): string => {
  if (!blocks || blocks.length === 0) {
    return '# 워크플로우가 구성되지 않았습니다.';
  }

  const doc: Record<string, unknown> = {};

  // * Trigger
  const triggerBlock = blocks.find((b) => b.type === 'trigger');
  if (triggerBlock) {
    if (triggerBlock.config && typeof triggerBlock.config === 'object') {
      Object.assign(doc, triggerBlock.config);
    }
  }

  // * Jobs
  const jobBlocks = blocks.filter((b) => b.type === 'job');
  if (jobBlocks.length > 0) {
    const jobs: Record<string, any> = {};
    for (const jobBlock of jobBlocks) {
      const jobId = (jobBlock['jobName'] as string) || toJobId(jobBlock.name);
      const jobObj: Record<string, unknown> = {
        ...(jobBlock.config || {}),
      };

      // * Steps attached to this job
      const stepBlocks = blocks.filter(
        (b) => b.type === 'step' && (b['jobName'] as string | undefined) === jobId,
      );
      if (stepBlocks.length > 0) {
        const stepsArr: any[] = [];
        for (const stepBlock of stepBlocks) {
          const stepConfig = { ...(stepBlock.config || {}) } as Record<string, unknown>;
          const stepName = (stepConfig.name as string) || stepBlock.name || '';
          const stepObj: Record<string, unknown> = { name: stepName };
          // * Merge remaining config except name
          Object.entries(stepConfig).forEach(([k, v]) => {
            if (k === 'name') return;
            (stepObj as any)[k] = v;
          });
          stepsArr.push(stepObj);
        }
        (jobObj as any).steps = stepsArr;
      }

      jobs[jobId] = jobObj;
    }
    (doc as any).jobs = jobs;
  }

  return stringifyYaml(doc);
};
