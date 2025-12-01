/**
 * Healer Page - AI-powered bug diagnosis
 */

'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, Loader2, Code, Lightbulb } from 'lucide-react';
import { useHealableFunctions, useDiagnose } from '@/lib/hooks/useApi';
import { timeAgo, formatNumber } from '@/lib/utils';
import type { DiagnosisResult } from '@/lib/types/api';

export default function HealerPage() {
  const [timeRange, setTimeRange] = useState(1440);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [lookback, setLookback] = useState(60);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const { data: functions, isLoading } = useHealableFunctions(timeRange);
  const diagnose = useDiagnose();

  const handleDiagnose = async () => {
    if (!selectedFunction) return;

    setDiagnosis(null);

    try {
      const result = await diagnose.mutateAsync({
        functionName: selectedFunction,
        lookbackMinutes: lookback,
      });
      setDiagnosis(result);
    } catch (error) {
      console.error('Diagnosis failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Healer
        </h1>
        <p className="text-muted-foreground">
          AI-powered bug diagnosis and fix suggestions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Function List */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold">Functions with Errors</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="text-xs rounded border border-border bg-background px-2 py-1"
              >
                <option value={60}>Last 1h</option>
                <option value={360}>Last 6h</option>
                <option value={1440}>Last 24h</option>
                <option value={4320}>Last 3d</option>
              </select>
            </div>

            <div className="divide-y divide-border max-h-[500px] overflow-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : !functions?.items || functions.items.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No functions with errors</p>
                  <p className="text-xs mt-1">Great! Everything looks healthy</p>
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
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-medium">{func.function_name}</code>
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                        {formatNumber(func.error_count)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {func.error_codes.slice(0, 3).map((code) => (
                        <span
                          key={code}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last error: {timeAgo(func.latest_error_time)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold mb-4">Diagnosis Configuration</h3>

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
                <label className="block text-sm font-medium mb-2">Lookback (minutes)</label>
                <input
                  type="number"
                  value={lookback}
                  onChange={(e) => setLookback(Number(e.target.value))}
                  min={5}
                  max={1440}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleDiagnose}
              disabled={!selectedFunction || diagnose.isPending}
              className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {diagnose.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Diagnose & Heal
            </button>
          </div>

          {/* Results */}
          {diagnosis && (
            <div className="space-y-4">
              {/* Diagnosis */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Diagnosis</h3>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                    diagnosis.status === 'success' 
                      ? 'bg-green-500/20 text-green-400'
                      : diagnosis.status === 'no_errors'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {diagnosis.status}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{diagnosis.diagnosis}</p>
              </div>

              {/* Suggested Fix */}
              {diagnosis.suggested_fix && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Suggested Fix</h3>
                  </div>
                  <div className="rounded-lg bg-muted p-4 overflow-auto">
                    <pre className="text-sm text-foreground">
                      <code>{diagnosis.suggested_fix}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!diagnosis && !diagnose.isPending && (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">AI-Powered Diagnosis</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Select a function with errors and click "Diagnose & Heal" to get 
                AI-generated insights and fix suggestions based on recent error patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
