"""
VectorWave data client for fetching execution logs and metrics
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import streamlit as st
import pandas as pd

# Import VectorWave modules (will be None if not available)
VECTORWAVE_IMPORTS_OK = False
try:
    from vectorwave.search.execution_search import (
        find_executions,
        find_recent_errors,
        find_slowest_executions,
        find_by_trace_id
    )
    from vectorwave import search_functions_hybrid
    from vectorwave.utils.status import get_registered_functions
    from vectorwave.database.db_search import search_functions, search_errors_by_message

    try:
        from vectorwave.database.db_search import get_token_usage_stats
    except ImportError:
        get_token_usage_stats = None

    try:
        from vectorwave import analyze_trace_log
    except ImportError:
        analyze_trace_log = None

    VECTORWAVE_IMPORTS_OK = True
    print("✅ VectorWave imports successful")
except ImportError as e:
    print(f"❌ VectorWave imports failed: {e}")
    VECTORWAVE_IMPORTS_OK = False

@st.cache_data(ttl=30)
def fetch_metrics(time_range_minutes: int) -> Dict[str, Any]:
    """
    Fetch key metrics from VectorWave
    """
    if not VECTORWAVE_IMPORTS_OK:
        return {
            'total_executions': 0, 'success_rate': 0.0, 'avg_duration': 0.0,
            'active_functions': 0, 'error_count': 0
        }

    try:
        time_limit = (datetime.now(timezone.utc) - timedelta(minutes=time_range_minutes)).isoformat()

        all_execs = find_executions(
            limit=10000,
            filters={"timestamp_utc__gte": time_limit},
            sort_by="timestamp_utc",
            sort_ascending=False
        )

        total = len(all_execs)

        if total == 0:
            return {
                'total_executions': 0, 'success_rate': 0.0, 'avg_duration': 0.0,
                'active_functions': 0, 'error_count': 0
            }

        success_count = sum(1 for e in all_execs if e.get('status') == 'SUCCESS')
        error_count = sum(1 for e in all_execs if e.get('status') == 'ERROR')

        durations = [e.get('duration_ms', 0) for e in all_execs if e.get('duration_ms')]
        avg_duration = sum(durations) / len(durations) if durations else 0

        unique_functions = len(set(e.get('function_name') for e in all_execs if e.get('function_name')))

        return {
            'total_executions': total,
            'success_rate': (success_count / total * 100) if total > 0 else 0,
            'avg_duration': avg_duration,
            'active_functions': unique_functions,
            'error_count': error_count
        }
    except Exception as e:
        st.error(f"❌ Failed to fetch metrics: {e}")
        return {
            'total_executions': 0, 'success_rate': 0.0, 'avg_duration': 0.0,
            'active_functions': 0, 'error_count': 0
        }

@st.cache_data(ttl=30)
def fetch_timeline_data(time_range_minutes: int) -> List[Dict[str, Any]]:
    """Fetch execution timeline data"""
    if not VECTORWAVE_IMPORTS_OK:
        return []

    try:
        time_limit = (datetime.now(timezone.utc) - timedelta(minutes=time_range_minutes)).isoformat()
        executions = find_executions(
            limit=10000,
            filters={"timestamp_utc__gte": time_limit},
            sort_by="timestamp_utc",
            sort_ascending=True
        )
        return executions
    except Exception as e:
        st.error(f"❌ Failed to fetch timeline data: {e}")
        return []

@st.cache_data(ttl=30)
def fetch_recent_errors_data(limit: int = 10, minutes_ago: int = 60) -> List[Dict[str, Any]]:
    """Fetch recent error logs"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    try:
        # [수정] minutes_ago 인자를 전달하도록 변경
        return find_recent_errors(limit=limit, minutes_ago=minutes_ago)
    except Exception as e:
        st.error(f"❌ Failed to fetch errors: {e}")
        return []

@st.cache_data(ttl=60)
def fetch_registered_functions() -> List[Dict[str, Any]]:
    """Fetch all registered functions"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    try:
        return get_registered_functions()
    except Exception as e:
        st.error(f"❌ Failed to fetch functions: {e}")
        return []

@st.cache_data(ttl=30)
def fetch_slowest_executions_data(limit: int = 10, min_duration_ms: float = 0.0) -> List[Dict[str, Any]]:
    """Fetch slowest execution logs"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    try:
        try:
            from vectorwave.search.execution_search import find_slowest_executions
            return find_slowest_executions(limit=limit, min_duration_ms=min_duration_ms)
        except ImportError:
            execs = find_executions(limit=100, sort_by="duration_ms", sort_ascending=False)
            return execs[:limit]
    except Exception as e:
        st.error(f"❌ Failed to fetch slowest executions: {e}")
        return []

def search_data(query: str, search_type: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search VectorWave data"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    try:
        if search_type == "Functions":
            return search_functions_hybrid(query=query, limit=limit)

        elif search_type == "Executions":
            # 1. 의미 기반 에러 검색 (fail, error 등의 키워드 감지)
            if query and ("fail" in query.lower() or "error" in query.lower() or "problem" in query.lower()):
                raw_results = search_errors_by_message(query=query, limit=limit)

                # [수정된 부분] UI가 데이터를 바로 읽을 수 있도록 '평탄화(Flatten)' 작업 수행
                flattened_results = []
                for res in raw_results:
                    # 'properties' 안에 있는 데이터를 끄집어냄
                    item = res.get('properties', {}).copy()

                    # UUID 등 필요한 메타데이터 병합
                    item['uuid'] = str(res.get('uuid'))
                    if res.get('metadata') and hasattr(res['metadata'], 'distance'):
                        item['distance'] = res['metadata'].distance

                    flattened_results.append(item)

                return flattened_results

            else:
                # 2. 일반 로그 검색 (최신순)
                return find_executions(limit=limit)
    except Exception as e:
        st.error(f"❌ Search failed: {e}")
        return []

@st.cache_data(ttl=30)
def fetch_function_stats(time_range_minutes: int) -> List[Dict[str, Any]]:
    """Fetch statistics for all functions"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    try:
        time_limit = (datetime.now(timezone.utc) - timedelta(minutes=time_range_minutes)).isoformat()
        return find_executions(
            limit=10000,
            filters={"timestamp_utc__gte": time_limit}
        )
    except Exception as e:
        st.error(f"❌ Failed to fetch function stats: {e}")
        return []

# --- NEW FEATURES ---

@st.cache_data(ttl=60)
def fetch_token_usage() -> Dict[str, int]:
    """Fetch LLM token usage statistics"""
    if not VECTORWAVE_IMPORTS_OK or not get_token_usage_stats:
        return {"total_tokens": 0}
    try:
        return get_token_usage_stats()
    except Exception as e:
        st.warning(f"Failed to fetch token usage: {e}")
        return {"total_tokens": 0}

@st.cache_data(ttl=30)
def fetch_cache_stats(time_range_minutes: int) -> Dict[str, Any]:
    """Calculate cache hit rate and saved time"""
    if not VECTORWAVE_IMPORTS_OK:
        return {"hit_rate": 0, "saved_time_ms": 0, "total_hits": 0}

    logs = fetch_timeline_data(time_range_minutes)
    if not logs:
        return {"hit_rate": 0, "saved_time_ms": 0, "total_hits": 0}

    total = len(logs)
    hits = sum(1 for log in logs if log.get('status') == 'CACHE_HIT')

    # Estimate saved time: (Avg Duration of Success) * Hits
    success_logs = [l for l in logs if l.get('status') == 'SUCCESS']
    if success_logs:
        avg_duration = sum(l.get('duration_ms', 0) for l in success_logs) / len(success_logs)
    else:
        avg_duration = 0

    saved_time = hits * avg_duration

    return {
        "hit_rate": (hits / total * 100) if total > 0 else 0,
        "saved_time_ms": saved_time,
        "total_hits": hits
    }

def get_trace_details(trace_id: str) -> List[Dict[str, Any]]:
    """Fetch full trace waterfall data"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    try:
        return find_by_trace_id(trace_id, limit=100)
    except Exception as e:
        st.error(f"Failed to fetch trace details: {e}")
        return []

def run_ai_analysis(trace_id: str, language: str = 'en') -> str:
    """Run AI Root Cause Analysis"""
    if not VECTORWAVE_IMPORTS_OK or not analyze_trace_log:
        return "AI analysis module not available."
    try:
        return analyze_trace_log(trace_id=trace_id, language=language)
    except Exception as e:
        return f"Error during AI analysis: {e}"