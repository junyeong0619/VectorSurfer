/**
 * Replay Page - Regression testing
 */

'use client';

import { useState } from 'react';
import { RotateCcw, Play, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useReplayableFunctions, useRunReplay, useRunSemanticReplay } from '@/lib/hooks/useApi';
import { timeAgo, formatNumber } from '@/lib/utils';
import type { ReplayResult } from '@/lib/types/api';

export default function ReplayPage() {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [testLimit, setTestLimit] = useState(10);
  const [useSemanticMode, setUseSemanticMode] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);

  const { data: functions, isLoading } = useReplayableFunctions();
  const runReplay = useRunReplay();
  const runSemanticReplay = useRunSemanticReplay();

  const handleRunTest = async () => {
    if (!selectedFunction) return;

    setResult(null);

    try {
      if (useSemanticMode) {
        const res = await runSemanticReplay.mutateAsync({
          functionFullName: selectedFunction,
          options: { limit: testLimit, semanticEval: true },
        });
        setResult(res);
      } else {
        const res = await runReplay.mutateAsync({
          functionFullName: selectedFunction,
          limit: testLimit,
        });
        setResult(res);
      }
    } catch (error) {
      console.error('Replay failed:', error);
    }
  };

  const isRunning = runReplay.isPending || runSemanticReplay.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Replay</h1>
        <p className="text-muted-foreground">
          Run regression tests using recorded inputs/outputs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Function List */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <h3 className="font-semibold">Replayable Functions</h3>
            </div>

            <div className="divide-y divide-border max-h-[500px] overflow-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : !functions?.items || functions.items.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No replayable functions</p>
                  <p className="text-xs mt-1">Functions logged with replay=True will appear here</p>
                </div>
              ) : (
                functions.items.map((func) => (
                  <button
                    key={func.function_name}
                    onClick={() => setSelectedFunction(func.function_name)}
                    className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                      selectedFunction === func.function_name ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <code className="text-sm font-medium">{func.function_name}</code>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatNumber(func.log_count)} logs</span>
                      <span>{timeAgo(func.latest_timestamp)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Test Configuration & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold mb-4">Test Configuration</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Selected Function</label>
                <input
                  type="text"
                  value={selectedFunction || ''}
                  readOnly
                  placeholder="Select a function from the list"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Cases Limit</label>
                <input
                  type="number"
                  value={testLimit}
                  onChange={(e) => setTestLimit(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSemanticMode}
                  onChange={(e) => setUseSemanticMode(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">Use Semantic Comparison (LLM)</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </label>
            </div>

            <button
              onClick={handleRunTest}
              disabled={!selectedFunction || isRunning}
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Tests
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-4">Test Results</h3>

              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg bg-green-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">{result.passed}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-500">{result.updated}</p>
                  <p className="text-xs text-muted-foreground">Updated</p>
                </div>
              </div>

              {/* Pass Rate Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Pass Rate</span>
                  <span className="font-medium">
                    {result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${result.total > 0 ? (result.passed / result.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Failures */}
              {result.failures && result.failures.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-500">Failures</h4>
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {result.failures.map((failure, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm"
                      >
                        <div className="grid gap-2">
                          <div>
                            <span className="text-muted-foreground">Input:</span>
                            <code className="ml-2 text-xs">{failure.input}</code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expected:</span>
                            <code className="ml-2 text-xs text-green-400">{failure.expected}</code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actual:</span>
                            <code className="ml-2 text-xs text-red-400">{failure.actual}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
