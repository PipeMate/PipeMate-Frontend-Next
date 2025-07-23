//* ========================================
//* YAML 생성 유틸리티
//* ========================================
//* 이 파일은 서버 블록 데이터를 GitHub Actions YAML 형식으로 변환합니다.
//* 단일 블록의 YAML과 전체 워크플로우 YAML을 생성할 수 있습니다.

import { ServerBlock } from "../types";

//* ========================================
//* 단일 블록 YAML 생성
//* ========================================

//* 단일 블록을 YAML로 변환
//? 블록 타입에 따라 적절한 YAML 구조를 생성
export const generateBlockYaml = (block: ServerBlock): string => {
  const yamlLines: string[] = [];

  //* ========================================
  //* 트리거 블록 YAML 생성
  //* ========================================
  if (block.type === "trigger") {
    //* 워크플로우 이름 설정
    if (block.config.name) {
      yamlLines.push(`name: ${block.config.name}`);
      yamlLines.push("");
    }

    //* 트리거 설정
    yamlLines.push("on:");
    const onConfig = block.config.on || {};

    Object.entries(onConfig).forEach(([triggerType, config]) => {
      if (triggerType === "push" || triggerType === "pull_request") {
        yamlLines.push(`  ${triggerType}:`);
        if (
          config.branches &&
          Array.isArray(config.branches) &&
          config.branches.length > 0
        ) {
          yamlLines.push("    branches:");
          config.branches.forEach((branch: string) => {
            yamlLines.push(`      - ${branch}`);
          });
        }
        if (
          config.paths &&
          Array.isArray(config.paths) &&
          config.paths.length > 0
        ) {
          yamlLines.push("    paths:");
          config.paths.forEach((path: string) => {
            yamlLines.push(`      - ${path}`);
          });
        }
      } else if (triggerType === "schedule") {
        yamlLines.push("  schedule:");
        if (Array.isArray(config)) {
          config.forEach((cronConfig: Record<string, unknown>) => {
            if (cronConfig.cron) {
              yamlLines.push(`    - cron: '${cronConfig.cron}'`);
            }
          });
        }
      } else if (triggerType === "workflow_dispatch") {
        yamlLines.push("  workflow_dispatch:");
      }
    });
  }

  //* ========================================
  //* Job 블록 YAML 생성
  //* ========================================
  else if (block.type === "job") {
    const jobsConfig = block.config.jobs || {};
    Object.entries(jobsConfig).forEach(([jobName, jobConfig]) => {
      yamlLines.push(`${jobName}:`);

      //* runs-on 설정
      if (jobConfig["runs-on"]) {
        yamlLines.push(`  runs-on: ${jobConfig["runs-on"]}`);
      }

      //* needs 설정
      if (jobConfig.needs && jobConfig.needs.length > 0) {
        yamlLines.push("  needs:");
        jobConfig.needs.forEach((need: string) => {
          yamlLines.push(`    - ${need}`);
        });
      }

      //* if 조건 설정
      if (jobConfig.if) {
        yamlLines.push(`  if: ${jobConfig.if}`);
      }

      //* timeout 설정
      if (jobConfig.timeout) {
        yamlLines.push(`  timeout-minutes: ${jobConfig.timeout}`);
      }

      //* 추가 설정들
      Object.entries(jobConfig).forEach(([key, value]) => {
        if (!["runs-on", "needs", "if", "timeout", "steps"].includes(key)) {
          if (typeof value === "string") {
            yamlLines.push(`  ${key}: ${value}`);
          } else {
            yamlLines.push(`  ${key}: ${JSON.stringify(value)}`);
          }
        }
      });
    });
  }

  //* ========================================
  //* Step 블록 YAML 생성
  //* ========================================
  else if (block.type === "step") {
    yamlLines.push(`- name: ${block.config.name}`);

    //* uses 설정 (Action 사용)
    if (block.config.uses) {
      yamlLines.push(`  uses: ${block.config.uses}`);
    }

    //* run 설정 (명령어 실행)
    if (block.config.run) {
      yamlLines.push(`  run: ${block.config.run}`);
    }

    //* with 설정 (Action 파라미터)
    if (block.config.with && Object.keys(block.config.with).length > 0) {
      yamlLines.push("  with:");
      Object.entries(block.config.with).forEach(([key, value]) => {
        if (typeof value === "string") {
          yamlLines.push(`    ${key}: ${value}`);
        } else {
          yamlLines.push(`    ${key}: ${JSON.stringify(value)}`);
        }
      });
    }

    //* env 설정 (환경 변수)
    if (block.config.env && Object.keys(block.config.env).length > 0) {
      yamlLines.push("  env:");
      Object.entries(block.config.env).forEach(([key, value]) => {
        yamlLines.push(`    ${key}: ${value}`);
      });
    }

    //* if 조건 설정
    if (block.config.if) {
      yamlLines.push(`  if: ${block.config.if}`);
    }

    //* continue-on-error 설정
    if (block.config["continue-on-error"] !== undefined) {
      yamlLines.push(
        `  continue-on-error: ${block.config["continue-on-error"]}`
      );
    }

    //* 추가 설정들
    Object.entries(block.config).forEach(([key, value]) => {
      if (
        ![
          "name",
          "uses",
          "run",
          "with",
          "env",
          "if",
          "continue-on-error",
        ].includes(key)
      ) {
        if (typeof value === "string") {
          yamlLines.push(`  ${key}: ${value}`);
        } else {
          yamlLines.push(`  ${key}: ${JSON.stringify(value)}`);
        }
      }
    });
  }

  return yamlLines.join("\n");
};

//* ========================================
//* 전체 워크플로우 YAML 생성
//* ========================================

//* 전체 블록들을 완전한 YAML로 변환
//! 모든 블록을 올바른 계층 구조로 조합하여 완전한 GitHub Actions YAML 생성
export const generateFullYaml = (blocks: ServerBlock[]): string => {
  const yamlLines: string[] = [];

  //* ========================================
  //* 트리거 블록 처리
  //* ========================================
  const triggerBlock = blocks.find((block) => block.type === "trigger");
  if (triggerBlock) {
    const triggerYaml = generateBlockYaml(triggerBlock);
    yamlLines.push(triggerYaml);
    yamlLines.push("");
  }

  //* ========================================
  //* Job 블록들 처리
  //* ========================================
  const jobBlocks = blocks.filter((block) => block.type === "job");
  if (jobBlocks.length > 0) {
    yamlLines.push("jobs:");

    jobBlocks.forEach((jobBlock, index) => {
      const jobConfig = jobBlock.config.jobs || {};
      const jobName = Object.keys(jobConfig)[0];
      const jobData = jobConfig[jobName as keyof typeof jobConfig] as Record<
        string,
        unknown
      >;

      if (jobName && jobData) {
        yamlLines.push(`${jobName}:`);

        //* runs-on 설정
        if (jobData["runs-on"]) {
          yamlLines.push(`  runs-on: ${jobData["runs-on"]}`);
        }

        //* needs 설정
        if (
          jobData.needs &&
          Array.isArray(jobData.needs) &&
          jobData.needs.length > 0
        ) {
          yamlLines.push("  needs:");
          jobData.needs.forEach((need: unknown) => {
            if (typeof need === "string") {
              yamlLines.push(`    - ${need}`);
            }
          });
        }

        //* if 조건 설정
        if (jobData.if && typeof jobData.if === "string") {
          yamlLines.push(`  if: ${jobData.if}`);
        }

        //* timeout 설정
        if (jobData.timeout && typeof jobData.timeout === "number") {
          yamlLines.push(`  timeout-minutes: ${jobData.timeout}`);
        }

        //* ========================================
        //* 해당 Job의 Step들 처리
        //* ========================================
        const stepBlocks = blocks.filter(
          (block) => block.type === "step" && block["job-name"] === jobName
        );

        if (stepBlocks.length > 0) {
          yamlLines.push("  steps:");
          stepBlocks.forEach((stepBlock) => {
            const stepYaml = generateBlockYaml(stepBlock);
            const stepLines = stepYaml.split("\n");
            stepLines.forEach((line) => {
              if (line.trim()) {
                yamlLines.push(`    ${line}`);
              }
            });
          });
        }

        //* 추가 Job 설정들
        Object.entries(jobData).forEach(([key, value]) => {
          if (!["runs-on", "needs", "if", "timeout", "steps"].includes(key)) {
            if (typeof value === "string") {
              yamlLines.push(`  ${key}: ${value}`);
            } else {
              yamlLines.push(`  ${key}: ${JSON.stringify(value)}`);
            }
          }
        });

        if (index < jobBlocks.length - 1) {
          yamlLines.push("");
        }
      }
    });
  }

  return yamlLines.join("\n");
};
