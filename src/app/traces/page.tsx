/**
 * Traces Page - Distributed tracing list
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GitBranch, Search, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTraces } from '@/lib/hooks/useApi';
import { formatDuration, timeAgo } from '@/lib/utils';

export default function TracesPage() {
  const [limit, setLimit] = useState(20);
  const { data, isLoading } = useTraces(limit);

  const traces = data || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Traces</h1>
          <p className="text-muted-foreground">
            View distributed traces and execution flows
          </p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value={20}>Last 20</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
        </select>
      </div>

      {/* Traces Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-card"
            />
          ))
        ) : traces.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <GitBranch className="h-12 w-12 mb-4 opacity-50" />
            <p>No traces found</p>
          </div>
        ) : (
          traces.map((trace) => (
            <Link
              key={trace.trace_id}
              href={`/traces/${trace.trace_id}`}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm font-medium truncate max-w-[150px]">
                    {trace.root_function}
                  </code>
                </div>
                <StatusBadge status={trace.status} size="sm" />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-medium text-foreground">
                    {formatDuration(trace.total_duration_ms)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Spans</span>
                  <span className="font-medium text-foreground">{trace.span_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time</span>
                  <span>{timeAgo(trace.start_time)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View details <ExternalLink className="h-3 w-3" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
