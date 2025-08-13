'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Search, Clipboard, ExternalLink } from 'lucide-react';

type Segment = {
  type: 'text' | 'meta' | 'bracket' | 'gha';
  text: string;
  level?: 'error' | 'warning' | 'notice';
};
const TOKEN_REGEX = /(##\[[^\]]*\]|\[[^\]]*\]|::(error|warning|notice)::)/gi;

// 스타일 상수/헬퍼(중앙 관리)
const LINE_BASE_CLASS =
  'font-mono text-[12px] leading-5 px-2 py-0.5 whitespace-pre-wrap break-words border-l-2 transition-colors duration-150 hover:bg-slate-600/70 hover:ring-1 hover:ring-slate-700';

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

const isStrongLine = (kind?: string) =>
  kind === 'error' || kind === 'warn' || kind === 'success';

// 타임스탬프 추출 유틸: 라인 앞의 날짜/시간 부분을 분리해 다른 색으로 표시
const TS_REGEX =
  /^(\[?\d{4}[-\/]\d{2}[-\/]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?\]?|\[?\d{2}:\d{2}:\d{2}\]?)/;
function extractTimestampPrefix(text: string): [string, string] {
  const m = text.match(TS_REGEX);
  if (!m) return ['', text];
  const prefix = m[0];
  const rest = text.slice(prefix.length).trimStart();
  return [prefix, rest];
}

function splitSegments(line: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of line.matchAll(TOKEN_REGEX)) {
    const m = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex)
      segments.push({ type: 'text', text: line.slice(lastIndex, start) });
    if (m.startsWith('::')) {
      const lvl = (match[2] as Segment['level']) || 'notice';
      segments.push({ type: 'gha', text: m, level: lvl });
    } else if (m.startsWith('##[')) {
      segments.push({ type: 'meta', text: m });
    } else if (m.startsWith('[')) {
      segments.push({ type: 'bracket', text: m });
    }
    lastIndex = start + m.length;
  }
  if (lastIndex < line.length)
    segments.push({ type: 'text', text: line.slice(lastIndex) });
  return segments;
}

function classifyLine(line: string, segments: Segment[]) {
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

function getLineClasses(kind: string) {
  const style = LINE_STYLE_MAP[kind] ?? LINE_STYLE_MAP.info;
  return `${LINE_BASE_CLASS} ${style.text} ${style.border} ${style.bg}`;
}

function renderSegment(seg: Segment, idx: number, lineKind?: string) {
  if (seg.type === 'meta') {
    const t = seg.text.toLowerCase();
    const strongLine = isStrongLine(lineKind);
    const color = strongLine
      ? 'text-current'
      : /error|fail/.test(t)
      ? 'text-red-400'
      : /warn/.test(t)
      ? 'text-amber-300'
      : /success|completed|ok/.test(t)
      ? 'text-green-400'
      : 'text-slate-200';
    const weight = /error|warn|success|completed|ok|fail/.test(t)
      ? 'font-bold'
      : 'font-semibold';
    return (
      <span key={idx} className={`${color} ${weight} text-[13px] px-1.5 mr-1`}>
        {seg.text}
      </span>
    );
  }
  if (seg.type === 'bracket') {
    const t = seg.text.toLowerCase();
    const strongLine = isStrongLine(lineKind);
    const color = strongLine
      ? 'text-current'
      : /error|fail/.test(t)
      ? 'text-red-300'
      : /warn/.test(t)
      ? 'text-amber-300'
      : /success|completed|ok/.test(t)
      ? 'text-green-300'
      : 'text-slate-200';
    const bg = strongLine ? 'bg-white/10' : 'bg-slate-700/30';
    return (
      <span
        key={idx}
        className={`px-1 ${bg} rounded-sm ${color} text-[11px] font-medium`}
      >
        {seg.text}
      </span>
    );
  }
  if (seg.type === 'gha') {
    const strongLine = isStrongLine(lineKind);
    const color = strongLine
      ? 'text-current'
      : seg.level === 'error'
      ? 'text-red-300'
      : seg.level === 'warning'
      ? 'text-amber-300'
      : 'text-blue-300';
    return (
      <span key={idx} className={`${color} text-[11px] font-semibold`}>
        {seg.text}
      </span>
    );
  }
  return <span key={idx}>{seg.text}</span>;
}

export default function LogViewer({ raw }: { raw: string }) {
  const text = raw || '로그가 없습니다.';
  const [query, setQuery] = useState<string>('');

  const items = useMemo(() => {
    const arr = (text.split(/\r?\n/) as string[]).map((line, idx) => {
      const segs = splitSegments(line);
      const kind = classifyLine(line, segs);
      return { line, segs, kind, lineNo: idx + 1 } as const;
    });
    return arr;
  }, [text]);

  const visible = useMemo(() => {
    return items.filter((it) =>
      query ? it.line.toLowerCase().includes(query.toLowerCase()) : true,
    );
  }, [items, query]);

  const highlight = (content: string, strongLine: boolean) => {
    if (!query) return content;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = content.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className={`${
            strongLine ? 'text-current' : 'text-yellow-900'
          } bg-yellow-200 rounded px-0.5`}
        >
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  };

  return (
    <div className="bg-white rounded border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-medium text-slate-900">Logs</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색"
              className="h-8 pl-7 pr-2 text-[12px] rounded border bg-white outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1.5 px-2.5"
            onClick={() => {
              navigator.clipboard.writeText(text).then(
                () => toast.success('로그를 클립보드에 복사했어요.'),
                () => toast.error('복사에 실패했어요.'),
              );
            }}
          >
            <Clipboard className="w-3.5 h-3.5" />
            복사
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1.5 px-2.5"
            onClick={() => {
              const w = window.open('', '_blank');
              if (w) {
                w.document.write(
                  `<pre style=\"white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.6; padding: 16px;\">${text}</pre>`,
                );
                w.document.close();
              }
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />새 창
          </Button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto rounded border border-slate-800 bg-slate-950 p-2">
        {visible.map((it, i) => (
          <div key={i} className={getLineClasses(it.kind)} title={it.kind}>
            <div className="flex items-start gap-1.5">
              <span className="w-9 pr-2 text-right text-slate-200 select-none">
                {it.lineNo}
              </span>
              <span className="flex-1">
                {it.segs.length
                  ? it.segs.map((s, idx) =>
                      s.type === 'text'
                        ? (() => {
                            const strong = isStrongLine(it.kind);
                            const [ts, rest] =
                              idx === 0 ? extractTimestampPrefix(s.text) : ['', s.text];
                            return (
                              <span key={idx}>
                                {idx === 0 && ts ? (
                                  <span className="text-slate-400 mr-2">{ts}</span>
                                ) : null}
                                {highlight(rest, strong)}
                              </span>
                            );
                          })()
                        : renderSegment(s, idx, it.kind),
                    )
                  : (() => {
                      const strong = isStrongLine(it.kind);
                      const [ts, rest] = extractTimestampPrefix(it.line);
                      return (
                        <>
                          {ts ? <span className="text-slate-400 mr-2">{ts}</span> : null}
                          {highlight(rest, strong)}
                        </>
                      );
                    })()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
