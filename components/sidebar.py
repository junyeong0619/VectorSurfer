"""
Dashboard sidebar component
"""
import streamlit as st
from typing import Dict, Any
from config.settings import get_time_range_options, get_status_options
from data.vectorwave_client import fetch_registered_functions

def render_sidebar(vectorwave_available: bool) -> Dict[str, Any]:
    """
    Render the dashboard sidebar with filters and settings
    
    Args:
        vectorwave_available: Whether VectorWave is available
        
    Returns:
        Dictionary with sidebar state (filters, settings, etc.)
    """
    sidebar_state = {}
    
    with st.sidebar:
        st.markdown("### ⚙️ Settings")
        
        # Time range selector
        time_range = st.selectbox(
            "Time Range",
            get_time_range_options(),
            index=2  # Default to "Last 1 hour"
        )
        sidebar_state['time_range'] = time_range
        
        st.markdown("---")
        
        # Filters section
        st.markdown("### 🔍 Filters")
        
        # Function filter
        if vectorwave_available:
            try:
                registered_funcs = fetch_registered_functions()
                func_names = ["All"] + [f.get('function_name', 'Unknown') for f in registered_funcs]
            except:
                func_names = ["All"]
        else:
            func_names = ["All"]
        
        function_filter = st.multiselect(
            "Functions",
            func_names,
            default=["All"]
        )
        sidebar_state['function_filter'] = function_filter
        
        # Status filter
        status_filter = st.multiselect(
            "Status",
            get_status_options(),
            default=["SUCCESS", "ERROR"]
        )
        sidebar_state['status_filter'] = status_filter
        
        st.markdown("---")
        
        # View options
        st.markdown("### 📊 View Options")
        
        auto_refresh = st.checkbox("Auto Refresh", value=False)
        sidebar_state['auto_refresh'] = auto_refresh
        
        if auto_refresh:
            refresh_interval = st.slider("Refresh interval (seconds)", 5, 60, 10)
            sidebar_state['refresh_interval'] = refresh_interval
            st.info(f"Dashboard will refresh every {refresh_interval}s")
        
        st.markdown("---")
        
        # Refresh button
        refresh_triggered = st.button("🔄 Refresh Now", use_container_width=True)
        sidebar_state['refresh_triggered'] = refresh_triggered
    
    return sidebar_state
