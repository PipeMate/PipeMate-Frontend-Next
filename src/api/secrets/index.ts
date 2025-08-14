// * GitHub Secrets 관리 API
// * - 조회/그룹조회/생성-수정/삭제/퍼블릭키 조회 제공
import { githubClient } from '@/api';
import { API_ENDPOINTS } from '@/config/apiConfig';
import {
  GithubSecretListResponse,
  GroupedGithubSecretListResponse,
  GithubSecretRequest,
  GithubPublicKeyResponse,
} from '@/api/types';

export const secretsAPI = {
  // * 2.1 Secrets 목록 조회 (기본)
  // * GitHub Secrets 목록을 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  getList: (owner: string, repo: string) =>
    githubClient.get<GithubSecretListResponse>(API_ENDPOINTS.GITHUB.SECRETS(owner, repo)),

  // * 2.2 Secrets 그룹화된 목록 조회 (새로 추가)
  // * GitHub Secrets를 그룹화하여 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  getGroupedList: (owner: string, repo: string) =>
    githubClient.get<GroupedGithubSecretListResponse>(
      API_ENDPOINTS.GITHUB.SECRETS(owner, repo),
    ),

  // * 2.3 Secret 생성/수정
  // * GitHub Secret을 생성하거나 수정합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param secretName Secret 이름
  // * @param data Secret 데이터
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

  // * 2.4 퍼블릭 키 조회
  // * GitHub Public Key를 조회합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  getPublicKey: (owner: string, repo: string) =>
    githubClient.get<GithubPublicKeyResponse>(
      API_ENDPOINTS.GITHUB.SECRET_PUBLIC_KEY(owner, repo),
    ),

  // * 2.5 Secret 삭제
  // * GitHub Secret을 삭제합니다.
  // * @param owner GitHub 소유자
  // * @param repo GitHub 리포지토리
  // * @param secretName Secret 이름
  delete: (owner: string, repo: string, secretName: string) =>
    githubClient.delete(API_ENDPOINTS.GITHUB.SECRET_DELETE(owner, repo, secretName)),
};
