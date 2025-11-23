"""
Cache utilities
"""
import streamlit as st

def clear_all_caches():
    """Clear all Streamlit caches"""
    st.cache_data.clear()
    st.cache_resource.clear()
