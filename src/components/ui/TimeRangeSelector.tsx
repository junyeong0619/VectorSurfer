/**
 * Time Range Selector Component
 */

'use client';

import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeRangeOption {
  label: string;
  value: number; // minutes
}

const defaultOptions: TimeRangeOption[] = [
  { label: 'Last 15 min', value: 15 },
  { label: 'Last 1 hour', value: 60 },
  { label: 'Last 6 hours', value: 360 },
  { label: 'Last 24 hours', value: 1440 },
  { label: 'Last 3 days', value: 4320 },
  { label: 'Last 7 days', value: 10080 },
];

interface TimeRangeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: TimeRangeOption[];
  className?: string;
}

export function TimeRangeSelector({
  value,
  onChange,
  options = defaultOptions,
  className,
}: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value) || options[1];

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                  option.value === value && 'bg-primary/10 text-primary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
