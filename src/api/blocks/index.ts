import githubClient from "@/api/githubClient";
import { BlockResponse } from "@/api/types";

// * Block 관리 API
export const blockAPI = {
  // * 4.1 모든 블록 조회
  getAll: () => githubClient.get<BlockResponse[]>("/api/blocks"),
};
