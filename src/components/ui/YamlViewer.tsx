'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, ExternalLink } from 'lucide-react';

interface YamlViewerProps {
  yaml: string;
  title?: string;
}

const LINE_BASE_CLASS =
  'font-mono text-[12px] leading-5 px-2 py-0.5 whitespace-pre-wrap break-words border-l-2 transition-colors duration-150 hover:bg-slate-600/70 hover:ring-1 hover:ring-slate-700';

export function YamlViewer({ yaml, title = 'YAML' }: YamlViewerProps) {
  const content = yaml || '# 내용이 없습니다.';
  const lines = useMemo(() => content.split(/\r?\n/), [content]);
  const highlight = (text: string) => text;

  return (
    <div className="bg-white rounded border border-slate-200">
      <div className="p-3 pb-2 flex items-center justify-between gap-2">
        <div className="font-medium text-slate-900">{title}</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1.5 px-2.5"
            onClick={() => navigator.clipboard.writeText(content)}
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
                  `<pre style="white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.6; padding: 16px;">${content
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')}</pre>`,
                );
                w.document.close();
              }
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />새 창
          </Button>
        </div>
      </div>
      <div className="m-3 mt-0 max-h-[520px] overflow-auto rounded border border-slate-800 bg-slate-950 p-2">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`${LINE_BASE_CLASS} text-slate-200 border-slate-800`}
          >
            <div className="flex items-start gap-1.5">
              <span className="w-9 pr-2 text-right text-slate-400 select-none">
                {index + 1}
              </span>
              <span className="flex-1">{highlight(line)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YamlViewer;
