//* ========================================
//* YAML 생성 유틸리티
//* ========================================
//* 이 파일은 서버 블록 데이터를 GitHub Actions YAML 형식으로 변환합니다.
//* 단일 블록의 YAML과 전체 워크플로우 YAML을 생성할 수 있습니다.

import { ServerBlock } from "../types";

//* ========================================
//* 단일 블록 YAML 생성
//* ========================================

//* 단일 블록을 YAML로 변환 (config 내용만 사용)
//? 블록 타입에 따라 적절한 YAML 구조를 생성
export const generateBlockYaml = (block: ServerBlock): string => {
  const yamlLines: string[] = [];

  // config가 없으면 빈 문자열 반환
  if (!block || !block.config) {
    return "# 설정이 없습니다.";
  }

  //* ========================================
  //* 트리거 블록 YAML 생성
  //* ========================================
  if (block.type === "trigger") {
    //* config 내용만 사용하여 YAML 생성
    Object.entries(block.config).forEach(([key, value]) => {
      if (typeof value === "string") {
        yamlLines.push(`${key}: ${value}`);
      } else if (typeof value === "object" && value !== null) {
        yamlLines.push(`${key}:`);
        if (Array.isArray(value)) {
          value.forEach((item: unknown) => {
            if (typeof item === "string") {
              yamlLines.push(`  - ${item}`);
            } else if (typeof item === "object" && item !== null) {
              Object.entries(item as Record<string, unknown>).forEach(
                ([k, v]) => {
                  if (typeof v === "string") {
                    yamlLines.push(`    ${k}: ${v}`);
                  } else {
                    yamlLines.push(`    ${k}: ${JSON.stringify(v)}`);
                  }
                }
              );
            }
          });
        } else {
          Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
            if (typeof v === "string") {
              yamlLines.push(`  ${k}: ${v}`);
            } else if (typeof v === "object" && v !== null) {
              yamlLines.push(`  ${k}:`);
              Object.entries(v as Record<string, unknown>).forEach(
                ([subK, subV]) => {
                  if (typeof subV === "string") {
                    yamlLines.push(`    ${subK}: ${subV}`);
                  } else {
                    yamlLines.push(`    ${subK}: ${JSON.stringify(subV)}`);
                  }
                }
              );
            } else {
              yamlLines.push(`  ${k}: ${JSON.stringify(v)}`);
            }
          });
        }
      }
    });
  }

  //* ========================================
  //* Job 블록 YAML 생성
  //* ========================================
  else if (block.type === "job") {
    //* config 내용만 사용하여 YAML 생성
    const jobsConfig = block.config.jobs || {};
    if (!jobsConfig || Object.keys(jobsConfig).length === 0) {
      yamlLines.push("# Job 설정이 없습니다.");
    } else {
      Object.entries(jobsConfig).forEach(([jobName, jobConfig]) => {
        yamlLines.push(`${jobName}:`);

        Object.entries(jobConfig as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (typeof value === "string") {
              yamlLines.push(`  ${key}: ${value}`);
            } else if (typeof value === "object" && value !== null) {
              if (Array.isArray(value)) {
                yamlLines.push(`  ${key}:`);
                value.forEach((item: unknown) => {
                  if (typeof item === "string") {
                    yamlLines.push(`    - ${item}`);
                  } else {
                    yamlLines.push(`    - ${JSON.stringify(item)}`);
                  }
                });
              } else {
                yamlLines.push(`  ${key}:`);
                Object.entries(value as Record<string, unknown>).forEach(
                  ([k, v]) => {
                    if (typeof v === "string") {
                      yamlLines.push(`    ${k}: ${v}`);
                    } else {
                      yamlLines.push(`    ${k}: ${JSON.stringify(v)}`);
                    }
                  }
                );
              }
            } else {
              yamlLines.push(`  ${key}: ${JSON.stringify(value)}`);
            }
          }
        );
      });
    }
  }

  //* ========================================
  //* Step 블록 YAML 생성
  //* ========================================
  else if (block.type === "step") {
    //* config 내용만 사용하여 YAML 생성
    if (!block.config || Object.keys(block.config).length === 0) {
      yamlLines.push("# Step 설정이 없습니다.");
    } else {
      Object.entries(block.config).forEach(([key, value]) => {
        if (typeof value === "string") {
          yamlLines.push(`${key}: ${value}`);
        } else if (typeof value === "object" && value !== null) {
          if (Array.isArray(value)) {
            yamlLines.push(`${key}:`);
            value.forEach((item: unknown) => {
              if (typeof item === "string") {
                yamlLines.push(`  - ${item}`);
              } else {
                yamlLines.push(`  - ${JSON.stringify(item)}`);
              }
            });
          } else {
            yamlLines.push(`${key}:`);
            Object.entries(value as Record<string, unknown>).forEach(
              ([k, v]) => {
                if (typeof v === "string") {
                  yamlLines.push(`  ${k}: ${v}`);
                } else {
                  yamlLines.push(`  ${k}: ${JSON.stringify(v)}`);
                }
              }
            );
          }
        } else {
          yamlLines.push(`${key}: ${JSON.stringify(value)}`);
        }
      });
    }
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

  // blocks가 없으면 빈 문자열 반환
  if (!blocks || blocks.length === 0) {
    return "# 워크플로우가 구성되지 않았습니다.";
  }

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
      const jobConfig = jobBlock.config?.jobs || {};
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
        //* 해당 Job의 Step들 처리 (job-name으로 연결)
        //* ========================================
        // job-name을 사용하여 step들을 찾음
        const jobNameForSteps = jobBlock["job-name"] || jobName;
        const stepBlocks = blocks.filter(
          (block) =>
            block.type === "step" && block["job-name"] === jobNameForSteps
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
