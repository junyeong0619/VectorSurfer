/**
 * Healer Page - AI-powered bug diagnosis
 * * 개선 사항:
 * - 상단 시간 필터 제거
 * - Functions with Errors에 필터 추가 (함수별, 시간별, 에러별)
 * - Selected Function을 드롭다운으로 변경
 * - 기본 조회 기간을 'All Time'으로 변경
 */

'use client';

import { useState, useMemo } from 'react';
import {
    Sparkles,
    AlertTriangle,
    Loader2,
    Code,
    Lightbulb,
    Clock,
    CheckCircle,
    XCircle,
    Copy,
    Check,
    Filter,
    Search,
    X,
    ChevronDown,
} from 'lucide-react';
import { useHealableFunctions, useDiagnose } from '@/lib/hooks/useApi';
import { timeAgo, formatNumber, cn } from '@/lib/utils';
import type { DiagnosisResult, HealableFunction } from '@/lib/types/api';

// ============ Code Block with Copy ============
interface CodeBlockProps {
    code: string;
    language?: string;
}

function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative rounded-xl bg-muted overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 text-sm overflow-auto max-h-80">
        <code>{code}</code>
      </pre>
        </div>
    );
}

// ============ Diagnosis Result Card ============
interface DiagnosisCardProps {
    result: DiagnosisResult;
}

function DiagnosisCard({ result }: DiagnosisCardProps) {
    const statusColors = {
        success: 'border-green-500/30 bg-green-500/5',
        no_errors: 'border-blue-500/30 bg-blue-500/5',
        error: 'border-red-500/30 bg-red-500/5',
    };

    const statusIcons = {
        success: <Lightbulb className="h-5 w-5 text-green-500" />,
        no_errors: <CheckCircle className="h-5 w-5 text-blue-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
    };

    return (
        <div className={cn('rounded-2xl border p-6', statusColors[result.status])}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {statusIcons[result.status]}
                    <div>
                        <h3 className="font-semibold">Diagnosis Result</h3>
                        <p className="text-xs text-muted-foreground">
                            Lookback: {result.lookback_minutes} minutes
                        </p>
                    </div>
                </div>
                <span className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    result.status === 'success' && 'bg-green-500/20 text-green-400',
                    result.status === 'no_errors' && 'bg-blue-500/20 text-blue-400',
                    result.status === 'error' && 'bg-red-500/20 text-red-400'
                )}>
          {result.status === 'success' ? 'Fix Suggested' :
              result.status === 'no_errors' ? 'No Errors Found' : 'Analysis Failed'}
        </span>
            </div>

            {/* Diagnosis */}
            <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Analysis
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {result.diagnosis}
                </p>
            </div>

            {/* Suggested Fix */}
            {result.suggested_fix && (
                <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4 text-primary" />
                        Suggested Fix
                    </h4>
                    <CodeBlock code={result.suggested_fix} />
                </div>
            )}
        </div>
    );
}

// ============ Filter Section ============
interface FilterSectionProps {
    functionFilter: string;
    setFunctionFilter: (v: string) => void;
    timeRangeFilter: number;
    setTimeRangeFilter: (v: number) => void;
    errorCodeFilter: string;
    setErrorCodeFilter: (v: string) => void;
    availableErrorCodes: string[];
    onClear: () => void;
}

function FilterSection({
                           functionFilter,
                           setFunctionFilter,
                           timeRangeFilter,
                           setTimeRangeFilter,
                           errorCodeFilter,
                           setErrorCodeFilter,
                           availableErrorCodes,
                           onClear,
                       }: FilterSectionProps) {
    // 기본값이 0(All Time)이므로, 0이 아닐 때만 필터가 적용된 것으로 간주
    const hasFilters = functionFilter || errorCodeFilter || timeRangeFilter !== 0;

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters</span>
                </div>
                {hasFilters && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Function Name Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Function name..."
                        value={functionFilter}
                        onChange={(e) => setFunctionFilter(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                </div>

                {/* Time Range Filter */}
                <select
                    value={timeRangeFilter}
                    onChange={(e) => setTimeRangeFilter(Number(e.target.value))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                    <option value={0}>All Time</option>
                    <option value={60}>Last 1 hour</option>
                    <option value={360}>Last 6 hours</option>
                    <option value={1440}>Last 24 hours</option>
                    <option value={4320}>Last 3 days</option>
                    <option value={10080}>Last 7 days</option>
                </select>

                {/* Error Code Filter */}
                <select
                    value={errorCodeFilter}
                    onChange={(e) => setErrorCodeFilter(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                    <option value="">All Error Codes</option>
                    {availableErrorCodes.map((code) => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// ============ Function Card ============
interface FunctionCardProps {
    func: HealableFunction;
    isSelected: boolean;
    onClick: () => void;
}

function FunctionCard({ func, isSelected, onClick }: FunctionCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left rounded-xl border p-4 transition-all',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-primary/50'
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-semibold truncate">{func.function_name}</code>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 shrink-0">
          {formatNumber(func.error_count)} errors
        </span>
            </div>

            {/* Error Codes */}
            <div className="flex flex-wrap gap-1 mb-2">
                {func.error_codes.slice(0, 3).map((code) => (
                    <span
                        key={code}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
            {code}
          </span>
                ))}
                {func.error_codes.length > 3 && (
                    <span className="text-xs text-muted-foreground">
            +{func.error_codes.length - 3} more
          </span>
                )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last error: {timeAgo(func.latest_error_time)}
            </p>
        </button>
    );
}

// ============ Function Selector Dropdown ============
interface FunctionSelectorProps {
    functions: HealableFunction[];
    selectedFunction: string | null;
    onSelect: (functionName: string | null) => void;
}

function FunctionSelector({ functions, selectedFunction, onSelect }: FunctionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedFunc = functions.find(f => f.function_name === selectedFunction);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                    selectedFunction
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted hover:border-primary/50'
                )}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {selectedFunction ? (
                        <>
                            <code className="text-sm font-semibold truncate">{selectedFunction}</code>
                            {selectedFunc && (
                                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 shrink-0">
                  {formatNumber(selectedFunc.error_count)} errors
                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">Select a function to diagnose...</span>
                    )}
                </div>
                <ChevronDown className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-card shadow-xl">
                    {functions.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No functions with errors
                        </div>
                    ) : (
                        functions.map((func) => (
                            <button
                                key={func.function_name}
                                onClick={() => {
                                    onSelect(func.function_name);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    'w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0',
                                    selectedFunction === func.function_name && 'bg-primary/5'
                                )}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <code className="text-sm font-medium truncate">{func.function_name}</code>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                    {formatNumber(func.error_count)}
                  </span>
                                    {selectedFunction === func.function_name && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ============ Main Page Component ============
export default function HealerPage() {
    // 필터 상태 - 기본값 변경 (10080 -> 0)
    const [functionFilter, setFunctionFilter] = useState('');
    const [timeRangeFilter, setTimeRangeFilter] = useState(0); // 0 = All Time
    const [errorCodeFilter, setErrorCodeFilter] = useState('');

    // 진단 설정
    const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
    const [lookback, setLookback] = useState(60);
    const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

    // API 호출 - 필터가 적용된 시간 범위로 데이터 가져오기
    const { data: functionsData, isLoading } = useHealableFunctions(timeRangeFilter);
    const diagnose = useDiagnose();

    // 필터 적용
    const filteredFunctions = useMemo(() => {
        let items = functionsData?.items || [];

        // 함수명 필터
        if (functionFilter) {
            items = items.filter(f =>
                f.function_name.toLowerCase().includes(functionFilter.toLowerCase())
            );
        }

        // 에러 코드 필터
        if (errorCodeFilter) {
            items = items.filter(f =>
                f.error_codes.includes(errorCodeFilter)
            );
        }

        return items;
    }, [functionsData, functionFilter, errorCodeFilter]);

    // 사용 가능한 에러 코드 목록
    const availableErrorCodes = useMemo(() => {
        const codes = new Set<string>();
        (functionsData?.items || []).forEach(f => {
            f.error_codes.forEach(code => codes.add(code));
        });
        return Array.from(codes).sort();
    }, [functionsData]);

    // 필터 초기화
    const clearFilters = () => {
        setFunctionFilter('');
        setTimeRangeFilter(0); // Reset to All Time
        setErrorCodeFilter('');
    };

    // 진단 실행
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

    const isRunning = diagnose.isPending;

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
                {/* Function List with Filters */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Functions with Errors</h3>
                        <span className="text-xs text-muted-foreground">
              {filteredFunctions.length} of {functionsData?.total || 0}
            </span>
                    </div>

                    {/* Filters */}
                    <FilterSection
                        functionFilter={functionFilter}
                        setFunctionFilter={setFunctionFilter}
                        timeRangeFilter={timeRangeFilter}
                        setTimeRangeFilter={setTimeRangeFilter}
                        errorCodeFilter={errorCodeFilter}
                        setErrorCodeFilter={setErrorCodeFilter}
                        availableErrorCodes={availableErrorCodes}
                        onClear={clearFilters}
                    />

                    {/* Function List */}
                    <div className="space-y-2 max-h-[500px] overflow-auto pr-2">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                            ))
                        ) : filteredFunctions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <CheckCircle className="h-10 w-10 mb-3 text-green-500 opacity-50" />
                                <p className="text-sm font-medium">No errors found!</p>
                                <p className="text-xs mt-1">
                                    {functionFilter || errorCodeFilter ? 'Try adjusting filters' : 'Everything looks healthy'}
                                </p>
                            </div>
                        ) : (
                            filteredFunctions.map((func) => (
                                <FunctionCard
                                    key={func.function_name}
                                    func={func}
                                    isSelected={selectedFunction === func.function_name}
                                    onClick={() => setSelectedFunction(func.function_name)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Configuration & Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Configuration */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="font-semibold mb-4">Diagnosis Configuration</h3>

                        <div className="grid gap-4 md:grid-cols-2 mb-6">
                            {/* Function Selector Dropdown */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Selected Function
                                </label>
                                <FunctionSelector
                                    functions={filteredFunctions}
                                    selectedFunction={selectedFunction}
                                    onSelect={setSelectedFunction}
                                />
                            </div>

                            {/* Lookback */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Lookback (minutes)</label>
                                <input
                                    type="number"
                                    value={lookback}
                                    onChange={(e) => setLookback(Number(e.target.value))}
                                    min={5}
                                    max={1440}
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Run Button */}
                        <button
                            onClick={handleDiagnose}
                            disabled={!selectedFunction || isRunning}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isRunning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {isRunning ? 'Analyzing...' : 'Diagnose & Heal'}
                        </button>
                    </div>

                    {/* Results */}
                    {diagnosis && <DiagnosisCard result={diagnosis} />}

                    {/* Empty State */}
                    {!diagnosis && !isRunning && (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="font-semibold mb-2">AI-Powered Diagnosis</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Select a function with errors and click Diagnose &amp; Heal to get
                                AI-generated insights and fix suggestions based on recent error patterns.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}