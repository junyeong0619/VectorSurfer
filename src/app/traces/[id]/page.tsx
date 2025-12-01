/**
 * Trace Detail Page - Waterfall view
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GitBranch, Sparkles, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTrace, useTraceAnalysis } from '@/lib/hooks/useApi';
import { formatDuration, timeAgo, cn } from '@/lib/utils';
import { useState } from 'react';

export default function TraceDetailPage() {
  const params = useParams();
  const traceId = params.id as string;
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>('ko');

  const { data: trace, isLoading } = useTrace(traceId);
  const { data: analysis, isLoading: analysisLoading, refetch: fetchAnalysis } = useTraceAnalysis(
    traceId,
    language
  );

  const handleAnalyze = () => {
    setShowAnalysis(true);
    fetchAnalysis();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trace || trace.status === 'NOT_FOUND') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Trace not found</p>
        <Link href="/traces" className="text-primary hover:underline">
          Back to traces
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/traces"
            className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trace Details</h1>
            <p className="text-sm text-muted-foreground font-mono">{traceId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ko')}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
          <button
            onClick={handleAnalyze}
            disabled={analysisLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {analysisLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI 분석
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="mt-1">
            <StatusBadge status={trace.status} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Duration</p>
          <p className="mt-1 text-xl font-bold">{formatDuration(trace.total_duration_ms)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Span Count</p>
          <p className="mt-1 text-xl font-bold">{trace.span_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Start Time</p>
          <p className="mt-1 text-sm font-medium">{timeAgo(trace.start_time)}</p>
        </div>
      </div>

      {/* AI Analysis */}
      {showAnalysis && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">AI Analysis</h3>
          </div>
          {analysisLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중...
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {analysis?.analysis || 'No analysis available'}
            </p>
          )}
        </div>
      )}

      {/* Waterfall View */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">Waterfall View</h3>
        <div className="space-y-1">
          {trace.spans.map((span) => {
            const widthPercent = (span.duration_ms / trace.total_duration_ms) * 100;
            const offsetPercent = ((span.offset_ms || 0) / trace.total_duration_ms) * 100;

            return (
              <div key={span.span_id} className="flex items-center gap-3">
                {/* Function name with indent */}
                <div
                  className="w-48 shrink-0 truncate text-sm"
                  style={{ paddingLeft: `${(span.depth || 0) * 16}px` }}
                >
                  <code className="text-foreground">{span.function_name}</code>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 h-6 bg-muted rounded relative">
                  <div
                    className={cn(
                      'absolute h-full rounded transition-all',
                      span.status === 'SUCCESS' && 'bg-green-500/70',
                      span.status === 'ERROR' && 'bg-red-500/70',
                      span.status === 'CACHE_HIT' && 'bg-blue-500/70'
                    )}
                    style={{
                      left: `${offsetPercent}%`,
                      width: `${Math.max(widthPercent, 1)}%`,
                    }}
                  />
                </div>

                {/* Duration */}
                <div className="w-20 shrink-0 text-right text-sm text-muted-foreground">
                  {formatDuration(span.duration_ms)}
                </div>

                {/* Status */}
                <div className="w-20 shrink-0">
                  <StatusBadge status={span.status} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
