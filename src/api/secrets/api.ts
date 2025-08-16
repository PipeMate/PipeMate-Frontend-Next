// * GitHub Secrets 관리 API
// * - 조회/그룹조회/생성-수정/삭제/퍼블릭키 조회 제공
import githubClient from '../githubClient';
import { API_ENDPOINTS } from '@/config';
import { GroupedGithubSecretListResponse, GithubSecretRequest } from './types';

export const secretsAPI = {
  // * Secrets 그룹화된 목록 조회
  getList: (owner: string, repo: string) =>
    githubClient.get<GroupedGithubSecretListResponse>(
      API_ENDPOINTS.GITHUB.SECRETS(owner, repo),
    ),

  // * Secret 생성/수정
  createOrUpdate: (
    owner: string,
    repo: string,
    secretName: string,
    data: GithubSecretRequest,
  ) =>
    githubClient.put(
      API_ENDPOINTS.GITHUB.SECRET_CREATE_OR_UPDATE(owner, repo, secretName),
      data,
    ),

  // * Secret 삭제
  delete: (owner: string, repo: string, secretName: string) =>
    githubClient.delete(API_ENDPOINTS.GITHUB.SECRET_DELETE(owner, repo, secretName)),
};
