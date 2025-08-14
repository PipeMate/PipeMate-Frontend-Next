//* ========================================
//* YAML 생성 유틸리티
//* ========================================
//* 이 파일은 서버 블록 데이터를 GitHub Actions YAML 형식으로 변환합니다.
//* 단일 블록의 YAML과 전체 워크플로우 YAML을 생성할 수 있습니다.

import { ServerBlock } from '../types';
import { stringifyYaml } from './yamlUtils';

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
  if (!block || !block.config || Object.keys(block.config).length === 0) {
    return '# 설정이 없습니다.';
  }
  // config 객체를 YAML 문자열로 안전하게 직렬화 (자동 들여쓰기)
  return stringifyYaml(block.config);
};

//* ========================================
//* 전체 워크플로우 YAML 생성
//* ========================================

//* 전체 블록들을 완전한 YAML로 변환
//! 모든 블록을 올바른 계층 구조로 조합하여 완전한 GitHub Actions YAML 생성
export const generateFullYaml = (blocks: ServerBlock[]): string => {
  if (!blocks || blocks.length === 0) {
    return '# 워크플로우가 구성되지 않았습니다.';
  }

  const doc: Record<string, unknown> = {};

  // Trigger
  const triggerBlock = blocks.find((b) => b.type === 'trigger');
  if (triggerBlock) {
    if (triggerBlock.config && typeof triggerBlock.config === 'object') {
      Object.assign(doc, triggerBlock.config);
    }
    if (triggerBlock.name) (doc as any).x_name = triggerBlock.name;
    if (triggerBlock.description) (doc as any).x_description = triggerBlock.description;
  }

  // Jobs
  const jobBlocks = blocks.filter((b) => b.type === 'job');
  if (jobBlocks.length > 0) {
    const jobs: Record<string, any> = {};
    for (const jobBlock of jobBlocks) {
      const jobId = (jobBlock['job-name'] as string) || toJobId(jobBlock.name);
      const jobObj: Record<string, unknown> = {
        ...(jobBlock.config || {}),
      };
      if (jobBlock.name) (jobObj as any).x_name = jobBlock.name;
      if (jobBlock.description) (jobObj as any).x_description = jobBlock.description;

      // Steps attached to this job
      const stepBlocks = blocks.filter(
        (b) => b.type === 'step' && (b['job-name'] as string | undefined) === jobId,
      );
      if (stepBlocks.length > 0) {
        const stepsArr: any[] = [];
        for (const stepBlock of stepBlocks) {
          const stepConfig = { ...(stepBlock.config || {}) } as Record<string, unknown>;
          const stepName = (stepConfig.name as string) || stepBlock.name || '';
          const stepObj: Record<string, unknown> = { name: stepName };
          // Merge remaining config except name
          Object.entries(stepConfig).forEach(([k, v]) => {
            if (k === 'name') return;
            (stepObj as any)[k] = v;
          });
          if (stepBlock.name) (stepObj as any).x_name = stepBlock.name;
          if (stepBlock.description)
            (stepObj as any).x_description = stepBlock.description;
          if (stepBlock.domain) (stepObj as any).x_domain = stepBlock.domain;
          if (Array.isArray(stepBlock.task) && stepBlock.task.length > 0)
            (stepObj as any).x_task = stepBlock.task;
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
