'use client';

import React, { useEffect, useRef } from 'react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  minRows = 2,
  maxRows = 16,
  className,
}) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(window.getComputedStyle(el).lineHeight || '20', 10);
    const rows = Math.min(
      maxRows,
      Math.max(minRows, Math.ceil(el.scrollHeight / (lineHeight || 20))),
    );
    el.style.height = `${rows * (lineHeight || 20)}px`;
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        'w-full p-3 border border-gray-300 rounded-md font-mono text-sm resize-y ' +
        (className || '')
      }
    />
  );
};

export default AutoResizeTextarea;
