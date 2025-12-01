/**
 * Functions Page - Function registry and search
 */

'use client';

import { useState } from 'react';
import { Code2, Search, MessageSquare, Loader2, Zap } from 'lucide-react';
import { useFunctions, useFunctionSearch, useFunctionAsk } from '@/lib/hooks/useApi';
import { formatNumber, formatDuration, formatPercentage } from '@/lib/utils';

export default function FunctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askResult, setAskResult] = useState<string | null>(null);

  const { data: allFunctions, isLoading: loadingAll } = useFunctions();
  const { data: searchResults, isLoading: loadingSearch } = useFunctionSearch(searchQuery, 20);

  const functions = searchQuery ? searchResults?.items : allFunctions?.items;
  const isLoading = searchQuery ? loadingSearch : loadingAll;

  const handleAsk = async () => {
    if (!askQuery.trim()) return;
    setIsAsking(true);
    setAskResult(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/functions/ask?q=${encodeURIComponent(askQuery)}&language=ko`
      );
      const data = await res.json();
      setAskResult(data.answer);
    } catch (error) {
      setAskResult('질문 처리 중 오류가 발생했습니다.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Functions</h1>
        <p className="text-muted-foreground">
          Browse registered functions and search with natural language
        </p>
      </div>

      {/* Search & Ask */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Semantic Search */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Semantic Search</h3>
          </div>
          <input
            type="text"
            placeholder="Search functions by description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Vector similarity search across function descriptions
          </p>
        </div>

        {/* Ask AI */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Ask AI</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about functions in natural language..."
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleAsk}
              disabled={isAsking || !askQuery.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
            </button>
          </div>
          {askResult && (
            <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
              {askResult}
            </div>
          )}
        </div>
      </div>

      {/* Functions List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">
            {functions?.length || 0} functions
          </span>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading functions...
            </div>
          ) : !functions || functions.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No functions found
            </div>
          ) : (
              functions.map((func, index) => (
                  <div
                      // 이름 뒤에 index를 붙여서 무조건 유일하게 만듭니다.
                      key={`${func.function_name}-${index}`}
                      className="px-4 py-4 hover:bg-muted/30 transition-colors"
                  >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-primary" />
                      <code className="text-sm font-semibold">{func.function_name}</code>
                      {func.team && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {func.team}
                        </span>
                      )}
                    </div>
                    {func.module && (
                      <p className="text-xs text-muted-foreground font-mono">{func.module}</p>
                    )}
                    {func.description && (
                      <p className="text-sm text-muted-foreground mt-1">{func.description}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    {func.execution_count !== undefined && (
                      <div className="text-center">
                        <p className="font-semibold">{formatNumber(func.execution_count)}</p>
                        <p className="text-xs text-muted-foreground">executions</p>
                      </div>
                    )}
                    {func.avg_duration_ms !== undefined && (
                      <div className="text-center">
                        <p className="font-semibold">{formatDuration(func.avg_duration_ms)}</p>
                        <p className="text-xs text-muted-foreground">avg duration</p>
                      </div>
                    )}
                    {func.error_rate !== undefined && (
                      <div className="text-center">
                        <p className={`font-semibold ${func.error_rate > 5 ? 'text-red-500' : ''}`}>
                          {formatPercentage(func.error_rate)}
                        </p>
                        <p className="text-xs text-muted-foreground">error rate</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
