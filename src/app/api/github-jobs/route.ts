/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/github-jobs/route.ts
import { Octokit } from "@octokit/rest";
import { NextRequest, NextResponse } from "next/server";

// 워크플로 실행(RunId) 기준 Jobs + steps 반환 (stepId 포함)
export async function GET(req: NextRequest) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const runId = Number(searchParams.get("runId"));

  if (!owner || !repo || !runId)
    return new NextResponse("필수 파라미터 누락", { status: 400 });

  const res = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId,
  });

  // steps에 반드시 id와 name 포함
  const jobs = (res.data.jobs || []).map((job: any) => ({
    id: String(job.id ?? ""),
    name: String(job.name ?? ""),
    steps: (job.steps || []).map((step: any) => ({
      id: String(step.id ?? ""),
      name: String(step.name ?? ""),
    })),
  }));

  return NextResponse.json(jobs);
}
