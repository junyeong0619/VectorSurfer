"""
Main tabs manager
"""
import streamlit as st
from typing import Dict, Any
# Use relative imports for modules in the same package
from .overview_tab import render_overview_tab
from .analytics_tab import render_analytics_tab
from .search_tab import render_search_tab
from .functions_tab import render_functions_tab

def render_tabs(sidebar_state: Dict[str, Any], vectorwave_available: bool):
    """
    Render all main dashboard tabs

    Args:
        sidebar_state: Dictionary with sidebar filters and settings
        vectorwave_available: Whether VectorWave is available
    """
    tabs = st.tabs(["📊 Overview", "📈 Analytics", "🔍 Search", "⚙️ Functions"])

    with tabs[0]:
        render_overview_tab(sidebar_state, vectorwave_available)

    with tabs[1]:
        render_analytics_tab(sidebar_state, vectorwave_available)

    with tabs[2]:
        render_search_tab(sidebar_state, vectorwave_available)

    with tabs[3]:
        render_functions_tab(sidebar_state, vectorwave_available)