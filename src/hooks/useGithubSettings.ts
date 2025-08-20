import { useCallback, useEffect, useState } from 'react';
import { STORAGES } from '@/config/appConstants';
import {
  deleteCookie,
  deleteRepositoryConfig,
  getCookie,
  getRepositoryConfig,
  setCookie,
  setRepositoryConfig,
} from '@/lib/cookieUtils';
import { useRepository } from '@/contexts/RepositoryContext';

// * GitHub 설정 관련 공통 로직을 관리하는 커스텀 훅
export function useGithubSettings() {
  const { setRepository } = useRepository();

  // * 토큰 관련 상태
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');

  // * 레포지토리 관련 상태
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [savedOwner, setSavedOwner] = useState<string | null>(null);
  const [savedRepo, setSavedRepo] = useState<string | null>(null);
  const [repoError, setRepoError] = useState('');

  // * 설정 상태 계산
  const hasToken = !!savedToken;
  const hasRepository = !!(savedOwner && savedRepo);
  const isSetupComplete = hasToken && hasRepository;

  // * 초기 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  // * 설정 로드 함수
  const loadSettings = useCallback(() => {
    // * 토큰 정보 로드
    const storedToken = getCookie(STORAGES.GITHUB_TOKEN);
    setSavedToken(storedToken);
    setToken(storedToken || '');

    // * 레포지토리 정보 로드
    const repoConfig = getRepositoryConfig();
    setSavedOwner(repoConfig.owner);
    setSavedRepo(repoConfig.repo);
    setOwner(repoConfig.owner || '');
    setRepo(repoConfig.repo || '');
  }, []);

  // * 토큰 저장 핸들러
  const handleSaveToken = useCallback(async () => {
    if (!token.trim()) {
      setTokenError('토큰을 입력해주세요.');
      return;
    }

    try {
      setCookie(STORAGES.GITHUB_TOKEN, token.trim());
      setSavedToken(token.trim());
      setTokenError('');

      // * 토큰 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('token-changed'));
    } catch (error) {
      console.error('토큰 저장 오류:', error);
      setTokenError('토큰 저장 중 오류가 발생했습니다.');
    }
  }, [token]);

  // * 토큰 삭제 핸들러
  const handleDeleteToken = useCallback(() => {
    try {
      deleteCookie(STORAGES.GITHUB_TOKEN);
      setSavedToken(null);
      setToken('');
      setTokenError('');

      // * 토큰 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('token-changed'));
    } catch (error) {
      setTokenError('토큰 삭제 중 오류가 발생했습니다.');
    }
  }, []);

  // * 레포지토리 저장 핸들러
  const handleSaveRepository = useCallback(() => {
    if (!owner.trim() || !repo.trim()) {
      setRepoError('소유자와 레포지토리 이름을 모두 입력해주세요.');
      return;
    }

    try {
      setRepositoryConfig(owner.trim(), repo.trim());
      setSavedOwner(owner.trim());
      setSavedRepo(repo.trim());
      setRepository(owner.trim(), repo.trim());
      setRepoError('');

      // * 레포지토리 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('repository-changed'));
    } catch (error) {
      setRepoError('레포지토리 설정 중 오류가 발생했습니다.');
    }
  }, [owner, repo, setRepository]);

  // * 레포지토리 삭제 핸들러
  const handleDeleteRepository = useCallback(() => {
    try {
      deleteRepositoryConfig();
      setSavedOwner(null);
      setSavedRepo(null);
      setOwner('');
      setRepo('');
      setRepoError('');

      // * 레포지토리 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('repository-changed'));
    } catch (error) {
      setRepoError('레포지토리 삭제 중 오류가 발생했습니다.');
    }
  }, []);

  return {
    // * 상태
    token,
    savedToken,
    tokenError,
    owner,
    repo,
    savedOwner,
    savedRepo,
    repoError,
    hasToken,
    hasRepository,
    isSetupComplete,

    // * 핸들러
    setToken,
    setOwner,
    setRepo,
    handleSaveToken,
    handleDeleteToken,
    handleSaveRepository,
    handleDeleteRepository,
    loadSettings,
  };
}
