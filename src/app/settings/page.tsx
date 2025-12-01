/**
 * Settings Page
 */

'use client';

import { useState } from 'react';
import { Settings, Database, RefreshCw, ExternalLink } from 'lucide-react';
import { useSystemStatus } from '@/lib/hooks/useApi';

export default function SettingsPage() {
  const { data: status, refetch, isRefetching } = useSystemStatus();
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure VectorSurfer dashboard settings
        </p>
      </div>

      {/* Connection Status */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Connection Status</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Database</p>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  status?.db_connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="font-medium">
                {status?.db_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Registered Functions</p>
            <p className="font-medium">{status?.registered_functions_count || 0}</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* API Configuration */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">API Configuration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">API Base URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full max-w-md rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set via NEXT_PUBLIC_API_URL environment variable
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mock Mode</label>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  process.env.NEXT_PUBLIC_USE_MOCK === 'true'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'Mock Data' : 'Real API'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Set NEXT_PUBLIC_USE_MOCK=true to use mock data
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Resources</h2>
        <div className="space-y-2">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            API Documentation (Swagger)
          </a>
          <a
            href="https://github.com/your-repo/vectorwave"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            VectorWave SDK
          </a>
        </div>
      </div>
    </div>
  );
}
