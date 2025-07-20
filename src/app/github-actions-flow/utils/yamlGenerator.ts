//* Blockly 워크스페이스에서 YAML 생성 유틸리티
import { GeneratedWorkflow, StepConfig } from "../types";

//* Blockly 워크스페이스에서 YAML 생성
export const generateYamlFromBlockly = (workspace: any): string => {
  //* 워크스페이스에서 모든 블록 가져오기
  const blocks = workspace.getAllBlocks(false);

  //* 워크플로우 기본 구조
  const workflow: GeneratedWorkflow = {
    name: "Generated Workflow",
    on: {
      workflow_dispatch: {},
      push: {
        branches: ["main"],
      },
    },
    jobs: {},
  };

  //* 블록들을 타입별로 분류
  const triggerBlocks = blocks.filter(
    (block: any) => block.type === "workflow_trigger"
  );
  const jobBlocks = blocks.filter((block: any) => block.type === "job_block");

  //* 트리거 블록 처리
  if (triggerBlocks.length > 0) {
    const triggerBlock = triggerBlocks[0];
    const workflowName =
      triggerBlock.getFieldValue("WORKFLOW_NAME") || "My Workflow";
    const branch = triggerBlock.getFieldValue("BRANCH") || "main";

    workflow.name = workflowName;
    workflow.on = {
      workflow_dispatch: {},
      push: { branches: [branch] },
    };
  }

  //* Job 블록 처리 - 내부 Step 블록들도 함께 처리
  jobBlocks.forEach((jobBlock: any) => {
    const jobName = jobBlock.getFieldValue("JOB_NAME") || "build";
    const runsOn = jobBlock.getFieldValue("RUNS_ON") || "ubuntu-latest";

    workflow.jobs[jobName] = {
      "runs-on": runsOn,
      steps: [],
    };

    //* Job 블록 내부의 Step 블록들을 처리
    const stepsInput = jobBlock.getInputTargetBlock("STEPS");
    if (stepsInput) {
      processSteps(stepsInput, workflow.jobs[jobName].steps);
    }
  });

  //* YAML 문자열 생성
  return generateYamlString(workflow);
};

//* Step 블록들을 순서대로 처리하는 함수
const processSteps = (block: any, steps: StepConfig[]) => {
  if (!block) return;

  const step = createStepFromBlock(block);
  if (step) {
    steps.push(step);
  }

  //* 다음 블록이 있으면 재귀적으로 처리
  const nextBlock = block.getNextBlock();
  if (nextBlock) {
    processSteps(nextBlock, steps);
  }
};

//* 블록에서 Step 생성
const createStepFromBlock = (block: any): StepConfig | null => {
  switch (block.type) {
    case "checkout_step":
      return {
        name: "Checkout repository",
        uses: "actions/checkout@v4",
      };

    case "java_setup_step":
      const javaVersion = block.getFieldValue("JAVA_VERSION") || "21";
      return {
        name: "Set up JDK",
        uses: "actions/setup-java@v4",
        with: {
          distribution: "adopt",
          "java-version": javaVersion,
        },
      };

    case "gradle_build_step":
      return {
        name: "Build with Gradle",
        run: "./gradlew build",
      };

    case "gradle_test_step":
      return {
        name: "Test with Gradle",
        run: "./gradlew test",
      };

    case "docker_login_step":
      return {
        name: "Docker Login",
        uses: "docker/login-action@v2",
        with: {
          username: "${{ secrets.DOCKER_USERNAME }}",
          password: "${{ secrets.DOCKER_PASSWORD }}",
        },
      };

    case "docker_build_step":
      const dockerTag = block.getFieldValue("DOCKER_TAG") || "my-app:latest";
      return {
        name: "Build Docker image",
        uses: "docker/build-push-action@v4",
        with: {
          context: ".",
          push: false,
          tags: dockerTag,
        },
      };

    case "ssh_deploy_step":
      return {
        name: "Deploy via SSH",
        uses: "appleboy/ssh-action@v0.1.10",
        with: {
          host: "${{ secrets.HOST }}",
          username: "${{ secrets.USERNAME }}",
          key: "${{ secrets.KEY }}",
          script: "echo 'Deploying...'",
        },
      };

    default:
      return null;
  }
};

//* 워크플로우 객체를 YAML 문자열로 변환
const generateYamlString = (workflow: GeneratedWorkflow): string => {
  return `name: ${workflow.name}

on:
${Object.entries(workflow.on)
  .map(([key, value]) => {
    if (
      typeof value === "object" &&
      value !== null &&
      Object.keys(value).length > 0
    ) {
      return `  ${key}:
${Object.entries(value)
  .map(([subKey, subValue]) => `    ${subKey}: ${JSON.stringify(subValue)}`)
  .join("\n")}`;
    } else {
      return `  ${key}:`;
    }
  })
  .join("\n")}

jobs:
${Object.entries(workflow.jobs)
  .map(([jobName, jobConfig]) => {
    return `  ${jobName}:
    runs-on: ${jobConfig["runs-on"]}
    steps:
${
  jobConfig.steps
    ?.map((step: StepConfig) => {
      let stepYaml = `    - name: ${step.name}\n`;
      if (step.uses) {
        stepYaml += `      uses: ${step.uses}\n`;
      }
      if (step.run) {
        stepYaml += `      run: |\n${step.run
          .split("\n")
          .map((line: string) => `        ${line}`)
          .join("\n")}\n`;
      }
      if (step.with) {
        stepYaml += `      with:\n`;
        Object.entries(step.with).forEach(([key, value]) => {
          stepYaml += `        ${key}: ${JSON.stringify(value)}\n`;
        });
      }
      return stepYaml;
    })
    .join("\n") || ""
}`;
  })
  .join("\n")}`;
};
