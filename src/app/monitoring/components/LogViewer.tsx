'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';

type Segment = { type: 'text' | 'meta' | 'bracket' | 'gha'; text: string; level?: 'error' | 'warning' | 'notice' };
const TOKEN_REGEX = /(##\[[^\]]*\]|\[[^\]]*\]|::(error|warning|notice)::)/gi;

function splitSegments(line: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of line.matchAll(TOKEN_REGEX)) {
    const m = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) segments.push({ type: 'text', text: line.slice(lastIndex, start) });
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
  if (lastIndex < line.length) segments.push({ type: 'text', text: line.slice(lastIndex) });
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
  const base = 'font-mono text-[12px] leading-6 px-2 py-1 rounded whitespace-pre-wrap break-words';
  switch (kind) {
    case 'error':
      return `${base} bg-red-50 text-red-700`;
    case 'warn':
      return `${base} bg-amber-50 text-amber-800`;
    case 'success':
      return `${base} bg-green-50 text-green-700`;
    case 'meta':
      return `${base} bg-slate-100 text-slate-700 mt-2`;
    default:
      return `${base} text-slate-700`;
  }
}

function renderSegment(seg: Segment, idx: number) {
  if (seg.type === 'meta')
    return (
      <span key={idx} className="inline-flex items-center gap-1 text-slate-700">
        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-semibold">
          {seg.text}
        </span>
      </span>
    );
  if (seg.type === 'bracket')
    return (
      <span key={idx} className="px-1 rounded bg-slate-100 text-slate-700">
        {seg.text}
      </span>
    );
  if (seg.type === 'gha') {
    const color = seg.level === 'error' ? 'bg-red-100 text-red-700' : seg.level === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700';
    return (
      <span key={idx} className={`px-1.5 py-0.5 rounded ${color} text-[11px] font-semibold`}>
        {seg.text}
      </span>
    );
  }
  return <span key={idx}>{seg.text}</span>;
}

export default function LogViewer({ raw }: { raw: string }) {
  const text = raw || '로그가 없습니다.';
  const lines = useMemo(() => text.split(/\r?\n/), [text]);
  return (
    <div className="bg-white rounded border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium text-slate-900">Logs</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(text)}>
            복사
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const w = window.open('', '_blank');
              if (w) {
                w.document.write(`<pre style=\"white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.6; padding: 16px;\">${text}</pre>`);
                w.document.close();
              }
            }}
          >
            새 창
          </Button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto rounded border bg-slate-50 p-2">
        {lines.map((line, i) => {
          const segs = splitSegments(line);
          const kind = classifyLine(line, segs);
          return (
            <div key={i} className={getLineClasses(kind)}>
              {segs.length ? segs.map(renderSegment) : line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
