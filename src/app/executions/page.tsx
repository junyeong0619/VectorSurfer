/**
 * Executions Page - Execution logs with filtering
 */

'use client';

import { useState } from 'react';
import { Activity, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { useExecutions } from '@/lib/hooks/useApi';
import { formatDuration, timeAgo, cn } from '@/lib/utils';
import type { ExecutionFilters } from '@/lib/types/api';

const PAGE_SIZE = 20;

export default function ExecutionsPage() {
  const [page, setPage] = useState(0);
  const [timeRange, setTimeRange] = useState(1440);
  const [filters, setFilters] = useState<ExecutionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const appliedFilters: ExecutionFilters = {
    ...filters,
    status: statusFilter || undefined,
    function_name: searchQuery || undefined,
    time_range: timeRange,
  };

  const { data, isLoading } = useExecutions(PAGE_SIZE, page * PAGE_SIZE, appliedFilters);

  const executions = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executions</h1>
          <p className="text-muted-foreground">
            Browse and filter function execution logs
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by function name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="ERROR">Error</option>
          <option value="CACHE_HIT">Cache Hit</option>
        </select>

        {/* Results count */}
        <span className="text-sm text-muted-foreground">
          {total} results
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Function</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duration</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Team</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No executions found
                </td>
              </tr>
            ) : (
              executions.map((exec) => (
                <tr key={exec.span_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-sm font-medium">{exec.function_name}</code>
                    {exec.error_message && (
                      <p className="text-xs text-red-400 mt-1 line-clamp-1">{exec.error_message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={exec.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDuration(exec.duration_ms)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {exec.team || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {timeAgo(exec.timestamp_utc)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/traces/${exec.trace_id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Trace
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
