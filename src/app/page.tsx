/**
 * Dashboard Overview Page
 */

'use client';

import { useState } from 'react';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  Clock, 
  BarChart3,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ExecutionTimeline } from '@/components/dashboard/ExecutionTimeline';
import { FunctionDistribution } from '@/components/dashboard/FunctionDistribution';
import { RecentErrors } from '@/components/dashboard/RecentErrors';
import { SystemStatusCard } from '@/components/dashboard/SystemStatusCard';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { 
  useKPIMetrics, 
  useSystemStatus,
  useTimeline,
  useFunctionDistribution,
  useRecentErrors,
} from '@/lib/hooks/useApi';
import { formatNumber, formatDuration, formatPercentage } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState(1440); // Default: 24 hours
  const queryClient = useQueryClient();

  const { data: status } = useSystemStatus();
  const { data: kpi, isLoading: kpiLoading, isFetching: kpiFetching } = useKPIMetrics(timeRange);
  const { data: timeline } = useTimeline(timeRange, Math.max(5, Math.floor(timeRange / 12)));
  const { data: distribution } = useFunctionDistribution(6);
  const { data: errors } = useRecentErrors(timeRange, 5);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your function executions in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RefreshCw className={cn('h-4 w-4', kpiFetching && 'animate-spin')} />
            Refresh
          </button>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <SystemStatusCard status={status} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Executions"
          value={kpiLoading ? '...' : formatNumber(kpi?.total_executions || 0)}
          subtitle={`Last ${timeRange >= 1440 ? Math.round(timeRange / 1440) + ' days' : timeRange >= 60 ? Math.round(timeRange / 60) + ' hours' : timeRange + ' min'}`}
          icon={<Activity className="h-4 w-4" />}
        />
        <KPICard
          title="Success Rate"
          value={kpiLoading ? '...' : formatPercentage(kpi?.success_rate || 0)}
          subtitle={`${formatNumber(kpi?.success_count || 0)} succeeded`}
          icon={<Zap className="h-4 w-4" />}
          variant={kpi && kpi.success_rate >= 95 ? 'success' : kpi && kpi.success_rate >= 80 ? 'warning' : 'error'}
        />
        <KPICard
          title="Avg Duration"
          value={kpiLoading ? '...' : formatDuration(kpi?.avg_duration_ms || 0)}
          subtitle="Mean response time"
          icon={<Clock className="h-4 w-4" />}
        />
        <KPICard
          title="Errors"
          value={kpiLoading ? '...' : formatNumber(kpi?.error_count || 0)}
          subtitle={`${formatNumber(kpi?.cache_hit_count || 0)} cache hits`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={kpi && kpi.error_count > 100 ? 'error' : kpi && kpi.error_count > 50 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Execution Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Executions over time
                </p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <ExecutionTimeline data={timeline || []} />
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Function Distribution</h3>
              <p className="text-sm text-muted-foreground">By execution count</p>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <FunctionDistribution data={distribution || []} />
        </div>
      </div>

      {/* Recent Errors */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Recent Errors</h3>
            <p className="text-sm text-muted-foreground">
              Latest errors
            </p>
          </div>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </div>
        <RecentErrors errors={errors?.items || []} />
      </div>
    </div>
  );
}

// cn helper inline for this file
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
