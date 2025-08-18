import type {
  JobConfig,
  StepConfig,
  StepConfigDetail,
  TriggerConfig,
} from '../types/areaNode';

// * 트리거 설정 파싱 함수
export const parseTriggerConfig = (config: Record<string, unknown>): TriggerConfig => {
  const triggers: string[] = [];
  const branches: string[] = [];
  const paths: string[] = [];
  let workflowName = '';

  // * 워크플로우 이름 추출
  if (config.name && typeof config.name === 'string') {
    workflowName = config.name;
  }

  if (config.on && typeof config.on === 'object') {
    const onConfig = config.on as Record<string, unknown>;

    // * 트리거 타입들 추출
    Object.keys(onConfig).forEach((triggerType) => {
      if (triggerType === 'workflow_dispatch') {
        triggers.push('수동 실행');
      } else if (triggerType === 'push') {
        triggers.push('Push');
      } else if (triggerType === 'pull_request') {
        triggers.push('Pull Request');
      } else if (triggerType === 'schedule') {
        triggers.push('스케줄');
      }
    });

    // * 브랜치 정보 추출
    if (onConfig.push && typeof onConfig.push === 'object') {
      const pushConfig = onConfig.push as Record<string, unknown>;
      if (pushConfig.branches && Array.isArray(pushConfig.branches)) {
        branches.push(...(pushConfig.branches as string[]));
      }
    }
    if (onConfig.pull_request && typeof onConfig.pull_request === 'object') {
      const prConfig = onConfig.pull_request as Record<string, unknown>;
      if (prConfig.branches && Array.isArray(prConfig.branches)) {
        branches.push(...(prConfig.branches as string[]));
      }
    }

    // * 경로 정보 추출
    if (onConfig.push && typeof onConfig.push === 'object') {
      const pushConfig = onConfig.push as Record<string, unknown>;
      if (pushConfig.paths && Array.isArray(pushConfig.paths)) {
        paths.push(...(pushConfig.paths as string[]));
      }
    }
    if (onConfig.pull_request && typeof onConfig.pull_request === 'object') {
      const prConfig = onConfig.pull_request as Record<string, unknown>;
      if (prConfig.paths && Array.isArray(prConfig.paths)) {
        paths.push(...(prConfig.paths as string[]));
      }
    }
  }

  return { triggers, branches, paths, workflowName };
};

// * Job 설정 파싱 함수
export const parseJobConfig = (config: Record<string, unknown>): JobConfig => {
  const runsOn: string[] = [];
  const needs: string[] = [];
  const timeout: string[] = [];
  const conditions: string[] = [];

  if (config.jobs && typeof config.jobs === 'object') {
    const jobsConfig = config.jobs as Record<string, unknown>;

    Object.values(jobsConfig).forEach((jobConfig) => {
      if (typeof jobConfig === 'object' && jobConfig !== null) {
        const job = jobConfig as Record<string, unknown>;

        if (job['runs-on']) {
          runsOn.push(String(job['runs-on']));
        }
        if (job.needs && Array.isArray(job.needs)) {
          needs.push(...(job.needs as string[]));
        }
        if (job.timeout) {
          timeout.push(String(job.timeout));
        }
        if (job.if) {
          conditions.push(String(job.if));
        }
      }
    });
  }

  // * 직접적인 config 속성들도 확인 (다른 형태의 Job 블록을 위해)
  if (config['runs-on']) {
    runsOn.push(String(config['runs-on']));
  }
  if (config.needs && Array.isArray(config.needs)) {
    needs.push(...(config.needs as string[]));
  }
  if (config.timeout) {
    timeout.push(String(config.timeout));
  }
  if (config.if) {
    conditions.push(String(config.if));
  }

  return { runsOn, needs, timeout, conditions };
};

// * Step 설정 파싱 함수
export const parseStepConfig = (config: Record<string, unknown>): StepConfig => {
  const uses: string[] = [];
  const run: string[] = [];
  const withParams: Record<string, unknown> = {};

  // * uses 정보 추출
  if (config.uses) {
    uses.push(String(config.uses));
  }

  // * run 정보 추출
  if (config.run) {
    run.push(String(config.run));
  }

  // * with 파라미터들 추출
  if (config.with && typeof config.with === 'object') {
    Object.assign(withParams, config.with);
  }

  // * steps 배열 내부의 정보들도 확인
  if (config.steps && Array.isArray(config.steps)) {
    config.steps.forEach((step) => {
      if (typeof step === 'object' && step !== null) {
        const stepConfig = step as Record<string, unknown>;

        if (stepConfig.uses) {
          uses.push(String(stepConfig.uses));
        }
        if (stepConfig.run) {
          run.push(String(stepConfig.run));
        }
        if (stepConfig.with && typeof stepConfig.with === 'object') {
          Object.assign(withParams, stepConfig.with);
        }
      }
    });
  }

  return { uses, run, withParams };
};

// * Step 상세 설정 파싱 함수
export const parseStepConfigDetail = (
  config: Record<string, unknown>,
): StepConfigDetail => {
  const result: StepConfigDetail = {};

  // * 기본 속성들 추출
  if (config.name) {
    result.name = String(config.name);
  }
  if (config.uses) {
    result.uses = String(config.uses);
  }
  if (config.run) {
    result.run = String(config.run);
  }
  if (config.with && typeof config.with === 'object') {
    result.with = config.with as Record<string, unknown>;
  }
  if (config.env && typeof config.env === 'object') {
    result.env = config.env as Record<string, string>;
  }
  if (config['continue-on-error'] !== undefined) {
    result.continueOnError = Boolean(config['continue-on-error']);
  }
  if (config.if) {
    result.if = String(config.if);
  }
  if (config['working-directory']) {
    result.workingDirectory = String(config['working-directory']);
  }
  if (config.shell) {
    result.shell = String(config.shell);
  }

  return result;
};
