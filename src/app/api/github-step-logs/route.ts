/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/github-step-logs/route.ts
import { Octokit } from "@octokit/rest";
import { NextRequest, NextResponse } from "next/server";

// Step별 Blob Storage 로그 직접 fetch (SAS 만료 시 logs_url 갱신 재시도)
export async function GET(req: NextRequest) {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { searchParams } = new URL(req.url);
    const owner = String(searchParams.get("owner") ?? "");
    const repo = String(searchParams.get("repo") ?? "");
    const jobId = Number(String(searchParams.get("jobId") ?? ""));
    const stepId = String(searchParams.get("stepId") ?? "");

    if (!owner || !repo || !jobId || !stepId) {
      return new NextResponse(
        "필수 파라미터 누락: owner, repo, jobId, stepId 필요",
        { status: 400 }
      );
    }

    // logs_url 및 step 정보 취득 함수
    async function getStepLogUrl() {
      const jobRes = await octokit.request(
        "GET /repos/{owner}/{repo}/actions/jobs/{job_id}",
        { owner, repo, job_id: jobId }
      );
      const logsUrl = String((jobRes.data as any).logs_url ?? "");
      const step = ((jobRes.data as any).steps ?? []).find(
        (s: any) => String(s.id ?? "") === String(stepId)
      );
      if (!logsUrl) {
        throw new Error("logs_url 정보를 가져오지 못했습니다.");
      }
      if (!step) {
        throw new Error(`stepId '${stepId}'에 해당하는 Step이 없습니다.`);
      }
      const urlObj = new URL(logsUrl);
      const basePath = urlObj.origin + urlObj.pathname.replace(/\/logs$/, "");
      const sasQuery = urlObj.search;
      const stepLogUrl = `${basePath}/logs/steps/step-logs-${String(
        stepId
      )}.txt${sasQuery}`;
      return stepLogUrl;
    }

    // 1차 시도
    let stepLogUrl = await getStepLogUrl();
    let blobRes = await fetch(stepLogUrl);

    // SAS 만료(403) 시 logs_url 갱신 후 1회 재시도
    if (!blobRes.ok && blobRes.status === 403) {
      stepLogUrl = await getStepLogUrl(); // logs_url 갱신
      blobRes = await fetch(stepLogUrl);
    }

    if (!blobRes.ok) {
      return new NextResponse("Step 로그를 Blob URL에서 가져오지 못했습니다.", {
        status: 404,
      });
    }
    const stepLogText = await blobRes.text();
    return new NextResponse(stepLogText, { status: 200 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as any).status === 403 &&
      "message" in error &&
      typeof (error as any).message === "string" &&
      (error as any).message.includes("rate limit")
    ) {
      return new NextResponse("GitHub API Rate Limit 초과", { status: 429 });
    }
    return new NextResponse(
      `서버 에러: ${
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : String(error)
      }`,
      {
        status: 500,
      }
    );
  }
}
