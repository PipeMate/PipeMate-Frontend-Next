import githubClient from '@/api/githubClient';
import {
  GithubSecretListResponse,
  GroupedGithubSecretListResponse,
  GithubSecretRequest,
  GithubPublicKeyResponse,
} from '@/api/types';

/**
 * GitHub Secrets 관리 API
 * - 조회/그룹조회/생성-수정/삭제/퍼블릭키 조회 제공
 */
export const secretsAPI = {
  // * 2.1 Secrets 목록 조회 (기본)
  getList: (owner: string, repo: string) =>
    githubClient.get<GithubSecretListResponse>('/api/github/repos/secrets', {
      params: { owner, repo },
    }),

  // * 2.2 Secrets 그룹화된 목록 조회 (새로 추가)
  getGroupedList: (owner: string, repo: string) =>
    githubClient.get<GroupedGithubSecretListResponse>('/api/github/repos/secrets', {
      params: { owner, repo },
    }),

  // * 2.3 Secret 생성/수정
  createOrUpdate: (
    owner: string,
    repo: string,
    secretName: string,
    data: GithubSecretRequest,
  ) =>
    githubClient.put(`/api/github/repos/secrets`, data, {
      params: { owner, repo, secretName },
    }),

  // * 2.4 퍼블릭 키 조회
  getPublicKey: (owner: string, repo: string) =>
    githubClient.get<GithubPublicKeyResponse>('/api/github/repos/secrets/public-key', {
      params: { owner, repo },
    }),

  // * 2.5 Secret 삭제
  delete: (owner: string, repo: string, secretName: string) =>
    githubClient.delete('/api/github/repos/secrets', {
      params: { owner, repo, secretName },
    }),
};
