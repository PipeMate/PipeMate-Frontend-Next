'use client';

import React from 'react';

type Props = {
  totalJobs: number;
  totalSteps: number;
  successSteps: number;
  failedSteps: number;
  skippedSteps: number;
  statusBadge: React.ReactNode;
};

export default function RunOverviewChips(props: Props) {
  const { totalJobs, totalSteps, successSteps, failedSteps, skippedSteps, statusBadge } =
    props;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px]">
      <div className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
        Jobs: <span className="font-semibold text-slate-900">{totalJobs}</span>
      </div>
      <div className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
        Steps: <span className="font-semibold text-slate-900">{totalSteps}</span>
      </div>
      <div className="px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
        Success: <span className="font-semibold">{successSteps}</span>
      </div>
      <div className="px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-700">
        Fail/Skip:{' '}
        <span className="font-semibold">
          {failedSteps}/{skippedSteps}
        </span>
      </div>
      <div className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center gap-1">
        {statusBadge}
      </div>
    </div>
  );
}
