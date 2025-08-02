// * Mock 데이터 - 백엔드 서버가 없을 때 사용
export const mockWorkflows = [
  {
    id: 1,
    name: "CI/CD Pipeline",
    path: ".github/workflows/ci-cd.yml",
    state: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    url: "https://api.github.com/repos/sayhi/pipemate-frontend-next/actions/workflows/1",
    htmlUrl:
      "https://github.com/sayhi/pipemate-frontend-next/actions/workflows/ci-cd.yml",
    badgeUrl:
      "https://github.com/sayhi/pipemate-frontend-next/workflows/CI%2FCD/badge.svg",
    manualDispatchEnabled: true,
    availableBranches: ["main", "develop", "feature/*"],
    fileName: "ci-cd.yml",
  },
  {
    id: 2,
    name: "Deploy to Production",
    path: ".github/workflows/deploy.yml",
    state: "active",
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-12T09:15:00Z",
    url: "https://api.github.com/repos/sayhi/pipemate-frontend-next/actions/workflows/2",
    htmlUrl:
      "https://github.com/sayhi/pipemate-frontend-next/actions/workflows/deploy.yml",
    badgeUrl:
      "https://github.com/sayhi/pipemate-frontend-next/workflows/Deploy/badge.svg",
    manualDispatchEnabled: true,
    availableBranches: ["main"],
    fileName: "deploy.yml",
  },
  {
    id: 3,
    name: "Test Suite",
    path: ".github/workflows/test.yml",
    state: "active",
    createdAt: "2024-01-08T16:45:00Z",
    updatedAt: "2024-01-14T11:20:00Z",
    url: "https://api.github.com/repos/sayhi/pipemate-frontend-next/actions/workflows/3",
    htmlUrl:
      "https://github.com/sayhi/pipemate-frontend-next/actions/workflows/test.yml",
    badgeUrl:
      "https://github.com/sayhi/pipemate-frontend-next/workflows/Test/badge.svg",
    manualDispatchEnabled: false,
    availableBranches: ["main", "develop"],
    fileName: "test.yml",
  },
];

export const mockWorkflowRuns = [
  {
    id: "123456789",
    name: "CI/CD Pipeline",
    status: "completed",
    conclusion: "success",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:05:00Z",
    run_number: 15,
  },
  {
    id: "123456788",
    name: "Deploy to Production",
    status: "completed",
    conclusion: "success",
    created_at: "2024-01-15T09:30:00Z",
    updated_at: "2024-01-15T09:35:00Z",
    run_number: 14,
  },
  {
    id: "123456787",
    name: "Test Suite",
    status: "in_progress",
    conclusion: null,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:02:00Z",
    run_number: 13,
  },
];

export const mockJobDetails = [
  {
    id: 1,
    name: "Build and Test",
    status: "completed",
    conclusion: "success",
    steps: [
      {
        name: "Checkout code",
        status: "completed",
        conclusion: "success",
        startedAt: "2024-01-15T10:00:00Z",
        completedAt: "2024-01-15T10:00:30Z",
      },
      {
        name: "Install dependencies",
        status: "completed",
        conclusion: "success",
        startedAt: "2024-01-15T10:00:30Z",
        completedAt: "2024-01-15T10:01:00Z",
      },
      {
        name: "Run tests",
        status: "completed",
        conclusion: "success",
        startedAt: "2024-01-15T10:01:00Z",
        completedAt: "2024-01-15T10:02:30Z",
      },
      {
        name: "Build application",
        status: "completed",
        conclusion: "success",
        startedAt: "2024-01-15T10:02:30Z",
        completedAt: "2024-01-15T10:03:00Z",
      },
    ],
  },
  {
    id: 2,
    name: "Deploy",
    status: "completed",
    conclusion: "success",
    steps: [
      {
        name: "Deploy to staging",
        status: "completed",
        conclusion: "success",
        startedAt: "2024-01-15T10:03:00Z",
        completedAt: "2024-01-15T10:04:00Z",
      },
      {
        name: "Run integration tests",
        status: "completed",
        conclusion: "success",
        startedAt: "2024-01-15T10:04:00Z",
        completedAt: "2024-01-15T10:05:00Z",
      },
    ],
  },
];

export const mockPipelineData = {
  workflowId: "mock-workflow-1",
  owner: "sayhi",
  repo: "pipemate-frontend-next",
  workflowName: "CI/CD Pipeline",
  originalJson: [
    {
      type: "trigger",
      config: {
        on: ["push", "pull_request"],
        branches: ["main", "develop"],
      },
    },
    {
      type: "job",
      name: "build-and-test",
      config: {
        runs_on: "ubuntu-latest",
        steps: [
          {
            name: "Checkout code",
            uses: "actions/checkout@v3",
          },
          {
            name: "Install dependencies",
            run: "npm install",
          },
          {
            name: "Run tests",
            run: "npm test",
          },
        ],
      },
    },
  ],
  convertedJson: {
    name: "CI/CD Pipeline",
    on: {
      push: { branches: ["main", "develop"] },
      pull_request: { branches: ["main", "develop"] },
    },
    jobs: {
      "build-and-test": {
        runs_on: "ubuntu-latest",
        steps: [
          { name: "Checkout code", uses: "actions/checkout@v3" },
          { name: "Install dependencies", run: "npm install" },
          { name: "Run tests", run: "npm test" },
        ],
      },
    },
  },
  yamlContent: `name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test`,
  githubPath: ".github/workflows/ci-cd.yml",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  success: true,
  message: "Workflow created successfully",
};

export const mockLogs = `2024-01-15T10:00:00.000Z [INFO] Starting workflow run
2024-01-15T10:00:00.123Z [INFO] Checkout code step started
2024-01-15T10:00:00.456Z [SUCCESS] Checkout code completed
2024-01-15T10:00:00.789Z [INFO] Install dependencies step started
2024-01-15T10:00:01.234Z [SUCCESS] Dependencies installed successfully
2024-01-15T10:00:01.567Z [INFO] Run tests step started
2024-01-15T10:00:02.890Z [SUCCESS] All tests passed
2024-01-15T10:00:03.123Z [INFO] Build application step started
2024-01-15T10:00:03.456Z [SUCCESS] Application built successfully
2024-01-15T10:00:03.789Z [INFO] Workflow completed successfully`;
