'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Search, Clipboard, ExternalLink, Download } from 'lucide-react';
import { copyToClipboard, downloadTextFile } from '../utils';

// * 로그 세그먼트 타입
type LogSegment = {
  type: 'text' | 'meta' | 'bracket' | 'gha';
  text: string;
  level?: 'error' | 'warning' | 'notice';
};

// * 로그 라인 타입
interface LogLine {
  line: string;
  segments: LogSegment[];
  kind: string;
  lineNo: number;
}

// * 토큰 정규식 (GitHub Actions 로그 파싱용)
const TOKEN_REGEX = /(##\[[^\]]*\]|\[[^\]]*\]|::(error|warning|notice)::)/gi;

// * 라인 기본 스타일 클래스
const LINE_BASE_CLASS =
  'font-mono text-[11px] leading-4 px-2 py-0.5 whitespace-pre-wrap break-words border-l-2 transition-colors duration-150 hover:bg-slate-600/70 hover:ring-1 hover:ring-slate-700';

// * 라인 스타일 매핑
const LINE_STYLE_MAP: Record<string, { text: string; border: string; bg: string }> = {
  error: {
    text: 'text-red-400 font-semibold',
    border: 'border-red-500',
    bg: 'bg-red-900/25',
  },
  warn: {
    text: 'text-amber-300 font-semibold',
    border: 'border-amber-500',
    bg: 'bg-amber-900/20',
  },
  success: {
    text: 'text-green-400 font-semibold',
    border: 'border-green-500',
    bg: 'bg-green-900/20',
  },
  meta: { text: 'text-slate-300', border: 'border-slate-600', bg: 'bg-slate-800/30' },
  info: { text: 'text-slate-200', border: 'border-slate-800', bg: 'bg-slate-900/10' },
};

// * 강조 라인 여부 확인
const isStrongLine = (kind?: string) =>
  kind === 'error' || kind === 'warn' || kind === 'success';

// * 타임스탬프 추출 (라인 앞의 날짜/시간 부분을 분리)
const TS_REGEX =
  /^(\[?\d{4}[-\/]\d{2}[-\/]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?\]?|\[?\d{2}:\d{2}:\d{2}\]?)/;

// * 타임스탬프와 나머지 텍스트 분리
function extractTimestampPrefix(text: string): [string, string] {
  const match = text.match(TS_REGEX);
  if (!match) return ['', text];
  const prefix = match[0];
  const rest = text.slice(prefix.length).trimStart();
  return [prefix, rest];
}

// * 라인을 세그먼트로 분할
function splitSegments(line: string): LogSegment[] {
  const segments: LogSegment[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(TOKEN_REGEX)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({ type: 'text', text: line.slice(lastIndex, start) });
    }

    if (token.startsWith('::')) {
      const level = (match[2] as LogSegment['level']) || 'notice';
      segments.push({ type: 'gha', text: token, level });
    } else if (token.startsWith('##[')) {
      segments.push({ type: 'meta', text: token });
    } else if (token.startsWith('[')) {
      segments.push({ type: 'bracket', text: token });
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < line.length) {
    segments.push({ type: 'text', text: line.slice(lastIndex) });
  }

  return segments;
}

// * 라인 분류 (에러, 경고, 성공 등)
function classifyLine(line: string, segments: LogSegment[]): string {
  const gha = segments.find((s) => s.type === 'gha');
  if (gha?.level === 'error') return 'error';
  if (gha?.level === 'warning') return 'warn';
  if (segments.some((s) => s.type === 'meta')) return 'meta';

  const lower = line.toLowerCase();
  if (/\b(error|exception|failed)\b/.test(lower)) return 'error';
  if (/\bwarn(ing)?\b/.test(lower)) return 'warn';
  if (/\b(success|completed)\b/.test(lower)) return 'success';

  return 'info';
}

// * 라인 스타일 클래스 반환
function getLineClasses(kind: string): string {
  const style = LINE_STYLE_MAP[kind] ?? LINE_STYLE_MAP.info;
  return `${LINE_BASE_CLASS} ${style.text} ${style.border} ${style.bg}`;
}

// * 세그먼트 렌더링
function renderSegment(segment: LogSegment, index: number, lineKind?: string) {
  if (segment.type === 'meta') {
    const text = segment.text.toLowerCase();
    const strongLine = isStrongLine(lineKind);
    const color = strongLine
      ? 'text-current'
      : /error|fail/.test(text)
      ? 'text-red-400'
      : /warn/.test(text)
      ? 'text-amber-300'
      : /success|completed|ok/.test(text)
      ? 'text-green-400'
      : 'text-slate-200';
    const weight = /error|warn|success|completed|ok|fail/.test(text)
      ? 'font-bold'
      : 'font-semibold';

    return (
      <span key={index} className={`${color} ${weight} text-[12px] px-1 mr-1`}>
        {segment.text}
      </span>
    );
  }

  if (segment.type === 'bracket') {
    const text = segment.text.toLowerCase();
    const strongLine = isStrongLine(lineKind);
    const color = strongLine
      ? 'text-current'
      : /error|fail/.test(text)
      ? 'text-red-300'
      : /warn/.test(text)
      ? 'text-amber-300'
      : /success|completed|ok/.test(text)
      ? 'text-green-300'
      : 'text-slate-200';
    const bg = strongLine ? 'bg-white/10' : 'bg-slate-700/30';

    return (
      <span
        key={index}
        className={`px-1 ${bg} rounded-sm ${color} text-[10px] font-medium`}
      >
        {segment.text}
      </span>
    );
  }

  if (segment.type === 'gha') {
    const strongLine = isStrongLine(lineKind);
    const color = strongLine
      ? 'text-current'
      : segment.level === 'error'
      ? 'text-red-300'
      : segment.level === 'warning'
      ? 'text-amber-300'
      : 'text-blue-300';

    return (
      <span key={index} className={`${color} text-[10px] font-semibold`}>
        {segment.text}
      </span>
    );
  }

  return <span key={index}>{segment.text}</span>;
}

// * 텍스트 하이라이트 (검색어 강조)
function highlightText(content: string, query: string, strongLine: boolean) {
  if (!query) return content;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = content.split(new RegExp(`(${escaped})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={index}
        className={`${
          strongLine ? 'text-current' : 'text-yellow-900'
        } bg-yellow-200 rounded px-0.5`}
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

// * LogViewer 컴포넌트 Props 타입
interface LogViewerProps {
  // * 로그 텍스트
  raw: string;
  // * 로그 파일명 (다운로드용)
  filename?: string;
}

// * 로그 뷰어 컴포넌트
export default function LogViewer({
  raw,
  filename = 'workflow-log.txt',
}: LogViewerProps) {
  const text = raw || '로그가 없습니다.';
  const [query, setQuery] = useState<string>('');

  // * 로그 라인 파싱
  const logLines = useMemo(() => {
    return text.split(/\r?\n/).map((line, index) => {
      const segments = splitSegments(line);
      const kind = classifyLine(line, segments);
      return { line, segments, kind, lineNo: index + 1 } as LogLine;
    });
  }, [text]);

  // * 검색 필터링
  const visibleLines = useMemo(() => {
    return logLines.filter((line) =>
      query ? line.line.toLowerCase().includes(query.toLowerCase()) : true,
    );
  }, [logLines, query]);

  // * 클립보드 복사
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('로그를 클립보드에 복사했습니다.');
    } else {
      toast.error('복사에 실패했습니다.');
    }
  };

  // * 새 창에서 열기
  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(
        `<pre style="white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.6; padding: 16px;">${text}</pre>`,
      );
      newWindow.document.close();
    }
  };

  // * 파일 다운로드
  const handleDownload = () => {
    downloadTextFile(filename, text);
  };

  return (
    <div className="bg-white rounded border border-slate-200 p-3 h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-2 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="font-medium text-slate-900">Logs</div>
        <div className="flex items-center gap-1">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색"
              className="h-7 pl-6 pr-2 text-[11px] rounded border bg-white outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 w-24 sm:w-32"
            />
          </div>

          {/* 복사 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1 px-2 h-7"
            onClick={handleCopy}
          >
            <Clipboard className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">복사</span>
          </Button>

          {/* 새 창 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1 px-2 h-7"
            onClick={handleOpenInNewWindow}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">새 창</span>
          </Button>

          {/* 다운로드 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1 px-2 h-7"
            onClick={handleDownload}
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">다운로드</span>
          </Button>
        </div>
      </div>

      {/* 로그 내용 */}
      <div className="flex-1 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 min-h-0">
        <div className="space-y-0">
          {visibleLines.map((line, index) => (
            <div key={index} className={getLineClasses(line.kind)} title={line.kind}>
              <div className="flex items-start gap-1">
                {/* 라인 번호 */}
                <span className="w-6 pr-1 text-right text-slate-200 select-none text-[10px] flex-shrink-0">
                  {line.lineNo}
                </span>

                {/* 라인 내용 */}
                <span className="flex-1 min-w-0">
                  {line.segments.length > 0
                    ? line.segments.map((segment, segmentIndex) =>
                        segment.type === 'text'
                          ? (() => {
                              const strong = isStrongLine(line.kind);
                              const [timestamp, rest] =
                                segmentIndex === 0
                                  ? extractTimestampPrefix(segment.text)
                                  : ['', segment.text];

                              return (
                                <span key={segmentIndex}>
                                  {segmentIndex === 0 && timestamp ? (
                                    <span className="text-slate-400 mr-1 text-[10px]">
                                      {timestamp}
                                    </span>
                                  ) : null}
                                  {highlightText(rest, query, strong)}
                                </span>
                              );
                            })()
                          : renderSegment(segment, segmentIndex, line.kind),
                      )
                    : (() => {
                        const strong = isStrongLine(line.kind);
                        const [timestamp, rest] = extractTimestampPrefix(line.line);

                        return (
                          <>
                            {timestamp ? (
                              <span className="text-slate-400 mr-1 text-[10px]">
                                {timestamp}
                              </span>
                            ) : null}
                            {highlightText(rest, query, strong)}
                          </>
                        );
                      })()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
