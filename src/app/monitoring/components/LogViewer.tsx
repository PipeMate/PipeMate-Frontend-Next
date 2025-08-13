'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type Segment = {
  type: 'text' | 'meta' | 'bracket' | 'gha';
  text: string;
  level?: 'error' | 'warning' | 'notice';
};
const TOKEN_REGEX = /(##\[[^\]]*\]|\[[^\]]*\]|::(error|warning|notice)::)/gi;

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
  const base =
    'font-mono text-[12px] leading-5 px-2 py-0.5 rounded whitespace-pre-wrap break-words text-slate-100';
  switch (kind) {
    case 'error':
      return `${base} bg-red-900/20 text-red-300`;
    case 'warn':
      return `${base} bg-amber-900/20 text-amber-300`;
    case 'success':
      return `${base} bg-green-900/20 text-green-300`;
    case 'meta':
      return `${base} bg-slate-800/50 text-slate-300`;
    default:
      return `${base}`;
  }
}

function renderSegment(seg: Segment, idx: number) {
  if (seg.type === 'meta')
    return (
      <span key={idx} className="text-slate-300 font-medium">
        {seg.text}
      </span>
    );
  if (seg.type === 'bracket')
    return (
      <span key={idx} className="px-1 rounded bg-white/10 text-slate-100">
        {seg.text}
      </span>
    );
  if (seg.type === 'gha') {
    const color =
      seg.level === 'error'
        ? 'bg-red-900/40 text-red-200'
        : seg.level === 'warning'
        ? 'bg-amber-900/40 text-amber-200'
        : 'bg-blue-900/40 text-blue-200';
    return (
      <span key={idx} className={`px-1 rounded ${color} text-[11px] font-semibold`}>
        {seg.text}
      </span>
    );
  }
  return <span key={idx}>{seg.text}</span>;
}

export default function LogViewer({ raw }: { raw: string }) {
  const text = raw || '로그가 없습니다.';
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'meta'>('all');
  const [query, setQuery] = useState<string>('');
  // 라인 번호는 기본적으로 표시 (토글 제거)

  const items = useMemo(() => {
    const arr = (text.split(/\r?\n/) as string[]).map((line, idx) => {
      const segs = splitSegments(line);
      const kind = classifyLine(line, segs);
      return { line, segs, kind, lineNo: idx + 1 } as const;
    });
    return arr;
  }, [text]);

  const visible = useMemo(() => {
    return items.filter((it) => {
      if (filter !== 'all' && it.kind !== filter) return false;
      if (query && !it.line.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, filter, query]);

  const highlight = (content: string) => {
    if (!query) return content;
    const parts = content.split(
      new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi'),
    );
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
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
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center rounded border bg-white overflow-hidden">
            {(
              [
                { k: 'all', t: '전체' },
                { k: 'error', t: '에러' },
                { k: 'warn', t: '워닝' },
                { k: 'meta', t: '메타' },
              ] as const
            ).map((f) => (
              <button
                key={f.k}
                className={`px-2.5 py-1 text-[12px] ${
                  filter === f.k ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                }`}
                onClick={() => setFilter(f.k as any)}
              >
                {f.t}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색"
            className="h-8 px-2 text-[12px] rounded border bg-white outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(text)}
          >
            복사
          </Button>
          <Button
            size="sm"
            variant="outline"
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
            새 창
          </Button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto rounded border border-slate-800 bg-slate-950 p-2">
        {visible.map((it, i) => (
          <div key={i} className={getLineClasses(it.kind)}>
            <div className="flex items-start gap-1.5">
              <span className="w-9 pr-1 text-right text-slate-400 select-none">
                {it.lineNo}
              </span>
              <span className="flex-1">
                {it.segs.length
                  ? it.segs.map((s, idx) =>
                      s.type === 'text' ? (
                        <span key={idx}>{highlight(s.text)}</span>
                      ) : (
                        renderSegment(s, idx)
                      ),
                    )
                  : highlight(it.line)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
