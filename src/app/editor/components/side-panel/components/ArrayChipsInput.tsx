'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ArrayChipsInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  helperText?: string;
}

const ArrayChipsInput: React.FC<ArrayChipsInputProps> = ({
  values,
  onChange,
  placeholder,
  helperText,
}) => {
  const [buffer, setBuffer] = useState<string>('');

  const addFromBuffer = () => {
    const parts = buffer
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const merged = Array.from(new Set([...(values || []), ...parts]));
    onChange(merged);
    setBuffer('');
  };

  const removeAt = (idx: number) => {
    const next = (values || []).filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={buffer}
          onChange={(e) => setBuffer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFromBuffer();
            }
          }}
          className="text-sm"
          placeholder={placeholder || '값1, 값2, 값3'}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addFromBuffer}
          className="whitespace-nowrap"
        >
          추가
        </Button>
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      <div className="flex flex-wrap gap-2">
        {(values || []).map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-gray-100 border border-gray-200"
          >
            <span className="font-mono">{v}</span>
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="remove-item"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ArrayChipsInput;
