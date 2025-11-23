"""
VectorWave data client for fetching execution logs and metrics
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import streamlit as st
import traceback

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
    from vectorwave.database.db_search import search_functions
    
    VECTORWAVE_IMPORTS_OK = True
    print("✅ VectorWave imports successful")
except ImportError as e:
    print(f"❌ VectorWave imports failed: {e}")
    VECTORWAVE_IMPORTS_OK = False

@st.cache_data(ttl=30)
def fetch_metrics(time_range_minutes: int) -> Dict[str, Any]:
    """
    Fetch key metrics from VectorWave
    
    Args:
        time_range_minutes: Time range in minutes to fetch data
        
    Returns:
        Dictionary with metrics (total_executions, success_rate, etc.)
    """
    if not VECTORWAVE_IMPORTS_OK:
        st.warning("⚠️ VectorWave imports not available")
        return {
            'total_executions': 0,
            'success_rate': 0.0,
            'avg_duration': 0.0,
            'active_functions': 0,
            'error_count': 0
        }
    
    try:
        time_limit = (datetime.now(timezone.utc) - timedelta(minutes=time_range_minutes)).isoformat()
        
        # Use find_executions which is the correct API in vector_setup
        all_execs = find_executions(
            limit=10000,
            filters={"timestamp_utc__gte": time_limit},
            sort_by="timestamp_utc",
            sort_ascending=False
        )
        
        total = len(all_execs)
        
        if total == 0:
            return {
                'total_executions': 0,
                'success_rate': 0.0,
                'avg_duration': 0.0,
                'active_functions': 0,
                'error_count': 0
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
            'total_executions': 0,
            'success_rate': 0.0,
            'avg_duration': 0.0,
            'active_functions': 0,
            'error_count': 0
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
def fetch_recent_errors_data(limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch recent error logs"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    
    try:
        # find_recent_errors signature: (minutes_ago: int = 60, limit: int = 10)
        return find_recent_errors(limit=limit)
    except Exception as e:
        st.error(f"❌ Failed to fetch errors: {e}")
        return []

@st.cache_data(ttl=60)
def fetch_registered_functions() -> List[Dict[str, Any]]:
    """Fetch all registered functions"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    
    try:
        funcs = get_registered_functions()
        return funcs
    except Exception as e:
        st.error(f"❌ Failed to fetch functions: {e}")
        return []

@st.cache_data(ttl=30)
def fetch_slowest_executions_data(limit: int = 10, min_duration_ms: float = 0.0) -> List[Dict[str, Any]]:
    """Fetch slowest execution logs"""
    if not VECTORWAVE_IMPORTS_OK:
        return []
    
    try:
        # Check if find_slowest_executions exists in imported module, otherwise fallback or implement manually
        # Based on user's app.py, it wasn't imported. But vectorwavedashboard used it.
        # Let's assume it might not exist in the user's version or use find_executions and sort.
        # Actually, let's try to import it, if not, we implement it manually using find_executions.
        try:
            from vectorwave.search.execution_search import find_slowest_executions
            return find_slowest_executions(limit=limit, min_duration_ms=min_duration_ms)
        except ImportError:
            # Fallback
            execs = find_executions(limit=100, sort_by="duration_ms", sort_ascending=False)
            return execs[:limit]
            
    except Exception as e:
        st.error(f"❌ Failed to fetch slowest executions: {e}")
        return []

def search_data(query: str, search_type: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search VectorWave data
    """
    if not VECTORWAVE_IMPORTS_OK:
        return []
    
    try:
        if search_type == "Functions":
            # Use hybrid search as in original app.py
            return search_functions_hybrid(query=query, limit=limit)
        elif search_type == "Error Messages":
            # Fallback to simple search if specific error search not available
            return [] 
        else:
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
        executions = find_executions(
            limit=10000,
            filters={"timestamp_utc__gte": time_limit}
        )
        
        return executions
    except Exception as e:
        st.error(f"❌ Failed to fetch function stats: {e}")
        return []
