import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, GitBranch } from "lucide-react";
import { STORAGES } from "@/config/appConstants";
import {
  setCookie,
  getCookie,
  deleteCookie,
  setRepositoryConfig,
  getRepositoryConfig,
  deleteRepositoryConfig,
} from "@/lib/cookieUtils";
import { useRepository } from "@/contexts/RepositoryContext";

interface GithubTokenDialogProps {
  trigger?: React.ReactNode;
  onTokenChange?: (token: string | null) => void;
}

export function GithubTokenDialog({
  trigger,
  onTokenChange,
}: GithubTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [savedOwner, setSavedOwner] = useState<string | null>(null);
  const [savedRepo, setSavedRepo] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [repoError, setRepoError] = useState("");
  const { setRepository } = useRepository();

  useEffect(() => {
    if (open) {
      // 토큰 정보 로드
      const storedToken = getCookie(STORAGES.GITHUB_TOKEN);
      setSavedToken(storedToken);
      setToken(storedToken || "");

      // 레포지토리 정보 로드
      const repoConfig = getRepositoryConfig();
      setSavedOwner(repoConfig.owner);
      setSavedRepo(repoConfig.repo);
      setOwner(repoConfig.owner || "");
      setRepo(repoConfig.repo || "");
    }
  }, [open]);

  const handleSaveToken = () => {
    if (!token.trim()) {
      setTokenError("토큰을 입력해주세요.");
      return;
    }
    setCookie(STORAGES.GITHUB_TOKEN, token.trim(), 30); // 30일간 저장
    setSavedToken(token.trim());
    setTokenError("");
    onTokenChange?.(token.trim());
  };

  const handleDeleteToken = () => {
    deleteCookie(STORAGES.GITHUB_TOKEN);
    setSavedToken(null);
    setToken("");
    setTokenError("");
    onTokenChange?.(null);
  };

  const handleSaveRepository = () => {
    if (!owner.trim()) {
      setRepoError("소유자를 입력해주세요.");
      return;
    }
    if (!repo.trim()) {
      setRepoError("레포지토리를 입력해주세요.");
      return;
    }

    setRepositoryConfig(owner.trim(), repo.trim());
    setSavedOwner(owner.trim());
    setSavedRepo(repo.trim());
    setRepository(owner.trim(), repo.trim());
    setRepoError("");
  };

  const handleDeleteRepository = () => {
    deleteRepositoryConfig();
    setSavedOwner(null);
    setSavedRepo(null);
    setOwner("");
    setRepo("");
    setRepository("", "");
    setRepoError("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 justify-center font-semibold text-base py-2 px-3 border-2 border-gray-200 hover:border-gray-400 transition-colors"
          >
            <Github className="text-[#24292f] size-5" />
            <span>설정 관리</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>GitHub 설정 관리</DialogTitle>
          <DialogDescription>
            GitHub API 연동을 위한 토큰과 레포지토리 설정을 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="token" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token" className="flex items-center gap-2">
              <Github size={16} />
              토큰
            </TabsTrigger>
            <TabsTrigger value="repository" className="flex items-center gap-2">
              <GitBranch size={16} />
              레포지토리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="token" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Personal Access Token
              </label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
              {tokenError && (
                <div className="text-destructive text-xs">{tokenError}</div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleSaveToken} disabled={!token.trim()}>
                저장
              </Button>
              {savedToken && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteToken}
                  type="button"
                >
                  삭제
                </Button>
              )}
            </DialogFooter>
          </TabsContent>

          <TabsContent value="repository" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">소유자 (Owner)</label>
                <Input
                  placeholder="GitHub 사용자명 또는 조직명"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  레포지토리 (Repository)
                </label>
                <Input
                  placeholder="레포지토리 이름"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                />
              </div>
              {repoError && (
                <div className="text-destructive text-xs">{repoError}</div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSaveRepository}
                disabled={!owner.trim() || !repo.trim()}
              >
                저장
              </Button>
              {savedOwner && savedRepo && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteRepository}
                  type="button"
                >
                  삭제
                </Button>
              )}
            </DialogFooter>
          </TabsContent>
        </Tabs>

        <DialogClose asChild>
          <Button variant="secondary" type="button" className="w-full">
            닫기
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
