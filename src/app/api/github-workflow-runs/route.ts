/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from "@octokit/rest";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { searchParams } = new URL(req.url);
  const owner = String(searchParams.get("owner") ?? "");
  const repo = String(searchParams.get("repo") ?? "");

  if (!owner || !repo) {
    return new NextResponse("필수 파라미터 누락", { status: 400 });
  }

  const res = await octokit.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 10, // 필요에 따라 조정
  });

  // 필요한 정보만 추려서 반환
  const runs = (res.data.workflow_runs || []).map((run: any) => ({
    id: String(run.id ?? ""),
    name: String(run.name ?? run.head_branch ?? ""),
  }));

  return NextResponse.json(runs);
}
