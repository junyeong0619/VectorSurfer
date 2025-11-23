"""
Search tab component
"""
import streamlit as st
from typing import Dict, Any
from data.vectorwave_client import search_data

def render_search_tab(sidebar_state: Dict[str, Any], vectorwave_available: bool):
    """Render the search tab"""
    
    st.markdown("### 🔍 Semantic Search")
    
    if not vectorwave_available:
        st.warning("⚠️ VectorWave is not available. Please check your configuration.")
        return
        
    col1, col2 = st.columns([3, 1])
    
    with col1:
        query = st.text_input("Search query", placeholder="Describe what you want to find...")
    
    with col2:
        search_type = st.selectbox("Search Type", ["Functions", "Executions"])
        
    if query:
        st.markdown("---")
        results = search_data(query, search_type)
        
        if results:
            st.success(f"Found {len(results)} results")
            for res in results:
                with st.expander(f"{res.get('name', res.get('function_name', 'Result'))} (Score: {res.get('score', 0):.4f})"):
                    st.json(res)
        else:
            st.warning("No results found")
