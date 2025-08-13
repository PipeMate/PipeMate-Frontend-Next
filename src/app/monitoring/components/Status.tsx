'use client';

import { Activity, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

export const getStatusIcon = (status: string, conclusion?: string) => {
  if (status === 'completed') {
    return conclusion === 'success' ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  } else if (status === 'in_progress') {
    return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />;
  } else if (status === 'waiting') {
    return <Clock className="w-4 h-4 text-yellow-600" />;
  } else {
    return <AlertTriangle className="w-4 h-4 text-gray-600" />;
  }
};

export const getStatusBadge = (status: string, conclusion?: string) => {
  const base =
    'border px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1';
  if (status === 'completed') {
    return conclusion === 'success' ? (
      <span className={`${base} bg-green-100 text-green-800 border-green-200`}>
        <CheckCircle className="w-3.5 h-3.5" /> 성공
      </span>
    ) : (
      <span className={`${base} bg-red-100 text-red-800 border-red-200`}>
        <XCircle className="w-3.5 h-3.5" /> 실패
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className={`${base} bg-blue-100 text-blue-800 border-blue-200`}>
        <Activity className="w-3.5 h-3.5" /> 실행 중
      </span>
    );
  }
  if (status === 'waiting') {
    return (
      <span className={`${base} bg-amber-100 text-amber-800 border-amber-200`}>
        <Clock className="w-3.5 h-3.5" /> 대기 중
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className={`${base} bg-gray-100 text-gray-700 border-gray-200`}>
        <XCircle className="w-3.5 h-3.5" /> 취소
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>
      <AlertTriangle className="w-3.5 h-3.5" /> 기타
    </span>
  );
};

export const getStepBadge = (status?: string, conclusion?: string) => {
  const base =
    'border px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1';
  if (conclusion) {
    if (conclusion === 'success')
      return (
        <span className={`${base} bg-green-100 text-green-800 border-green-200`}>
          <CheckCircle className="w-3.5 h-3.5" /> 성공
        </span>
      );
    if (conclusion === 'failure' || conclusion === 'failed')
      return (
        <span className={`${base} bg-red-100 text-red-800 border-red-200`}>
          <XCircle className="w-3.5 h-3.5" /> 실패
        </span>
      );
    if (conclusion === 'cancelled')
      return (
        <span className={`${base} bg-gray-100 text-gray-700 border-gray-200`}>
          <XCircle className="w-3.5 h-3.5" /> 취소
        </span>
      );
    if (conclusion === 'skipped')
      return (
        <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>
          <AlertTriangle className="w-3.5 h-3.5" /> 건너뜀
        </span>
      );
  }
  if (status === 'in_progress')
    return (
      <span className={`${base} bg-blue-100 text-blue-800 border-blue-200`}>
        <Activity className="w-3.5 h-3.5" /> 실행 중
      </span>
    );
  if (status === 'queued' || status === 'waiting')
    return (
      <span className={`${base} bg-amber-100 text-amber-800 border-amber-200`}>
        <Clock className="w-3.5 h-3.5" /> 대기 중
      </span>
    );
  return (
    <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>
      <AlertTriangle className="w-3.5 h-3.5" /> {status || '기타'}
    </span>
  );
};

export const getStepTone = (status?: string, conclusion?: string) => {
  if (conclusion === 'success')
    return { dot: 'bg-green-500', border: 'border-l-2 border-green-400' };
  if (conclusion === 'failure' || conclusion === 'failed')
    return { dot: 'bg-red-500', border: 'border-l-2 border-red-400' };
  if (conclusion === 'cancelled')
    return { dot: 'bg-gray-400', border: 'border-l-2 border-gray-300' };
  if (conclusion === 'skipped')
    return { dot: 'bg-slate-400', border: 'border-l-2 border-slate-300' };
  if (status === 'in_progress')
    return { dot: 'bg-blue-500', border: 'border-l-2 border-blue-400' };
  if (status === 'queued' || status === 'waiting')
    return { dot: 'bg-amber-500', border: 'border-l-2 border-amber-400' };
  return { dot: 'bg-slate-300', border: 'border-l-2 border-slate-200' };
};
