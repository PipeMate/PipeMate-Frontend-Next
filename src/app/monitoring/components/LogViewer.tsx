'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export default function LogViewer({ raw }: { raw: string }) {
  const openInNewWindow = (title: string, content: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(
        `<html><head><title>${title}</title></head><body><pre style="white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.6; padding: 16px;">${content}
        </pre></body></html>`,
      );
      newWindow.document.close();
    }
  };
  const snippet = raw || '로그가 없습니다.';
  return (
    <div className="bg-slate-50 rounded border p-3 text-[12px] text-slate-700">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium text-slate-900">Raw Logs</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(snippet)}
          >
            복사
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openInNewWindow('Workflow Run Logs', snippet)}
          >
            새 창
          </Button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words text-[12px] leading-6 font-mono">
        {snippet}
      </pre>
    </div>
  );
}
