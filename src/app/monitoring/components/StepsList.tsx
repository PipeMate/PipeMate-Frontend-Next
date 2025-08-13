'use client';

import React from 'react';
import { getStepBadge, getStepTone, getStatusIcon } from './Status';

type Step = {
  name: string;
  status?: string;
  conclusion?: string;
  startedAt?: string;
  completedAt?: string;
};

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return '';
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const sec = Math.max(0, Math.floor((e - s) / 1000));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export default function StepsList({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-2 grid gap-1.5">
      {steps.map((st, idx) => {
        const tone = getStepTone(st.status, st.conclusion);
        const iconOnly = getStatusIcon(st.status || '', st.conclusion);
        return (
          <div
            key={idx}
            className={`flex items-center justify-between text-[13px] text-left w-full px-2.5 py-1.5 rounded ${tone.bg}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                {idx + 1}
              </span>
              <span className="truncate text-slate-700">{st.name}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatDuration(st.startedAt, st.completedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">{iconOnly}</div>
          </div>
        );
      })}
    </div>
  );
}
