/**
 * Errors Page - Error analysis and trends
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Search, TrendingUp } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { useErrors, useErrorSummary, useErrorTrends, useErrorSearch } from '@/lib/hooks/useApi';
import { timeAgo, formatNumber } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ErrorsPage() {
  const [timeRange, setTimeRange] = useState(1440);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: errors, isLoading: loadingErrors } = useErrors(50, { time_range: timeRange });
  const { data: summary } = useErrorSummary(timeRange);
  const { data: trends } = useErrorTrends(timeRange, Math.max(60, Math.floor(timeRange / 24)));
  const { data: searchResults, isLoading: searching } = useErrorSearch(searchQuery, 20);

  const displayErrors = searchQuery ? searchResults?.items : errors?.items;

  const trendData = trends?.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    count: t.count,
  })) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Errors</h1>
          <p className="text-muted-foreground">
            Analyze error patterns and search by message
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-muted-foreground">Total Errors</p>
          <p className="text-2xl font-bold text-red-500">
            {formatNumber(summary?.total_errors || 0)}
          </p>
        </div>

        {summary?.by_error_code?.slice(0, 3).map((item) => (
          <div key={item.error_code} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{item.error_code}</p>
            <p className="text-2xl font-bold">{formatNumber(item.count)}</p>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Error Trend</h3>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#888', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  axisLine={{ stroke: '#333' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search errors by message (semantic search)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Error List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">
            {displayErrors?.length || 0} errors
          </span>
        </div>

        <div className="divide-y divide-border">
          {loadingErrors || searching ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : !displayErrors || displayErrors.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No errors found
            </div>
          ) : (
            displayErrors.map((error) => (
              <div
                key={error.span_id}
                className="px-4 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-medium">{error.function_name}</code>
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                        {error.error_code}
                      </span>
                      {error.team && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {error.team}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{error.error_message}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(error.timestamp_utc)}</p>
                  </div>
                  <a
                    href={`/traces/${error.trace_id}`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    View Trace
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
