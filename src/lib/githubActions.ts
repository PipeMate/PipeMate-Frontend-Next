import { Octokit } from "@octokit/action";

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN });

export async function fetchWorkflowJobs(
  owner: string,
  repo: string,
  runId: number
) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
    {
      owner,
      repo,
      run_id: runId,
    }
  );
  return res.data.jobs;
}
