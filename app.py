"""
VectorWave Dashboard - Main Entry Point
A Grafana-style monitoring dashboard for VectorWave
"""
import streamlit as st
from datetime import datetime
import sys
import os

# Ensure we can import from the current directory/environment
sys.path.append(os.getcwd())

# Import configuration
from config.settings import init_page_config, check_vectorwave_availability

# Import styles
from styles.custom_css import apply_custom_styles

# Import components
from components.header import render_header
from components.sidebar import render_sidebar
from components.tabs.tab_manager import render_tabs

# Import utilities
from utils.cache import clear_all_caches

# Import VectorWave initialization
try:
    from vectorwave import initialize_database
except ImportError:
    pass

def main():
    """Main application entry point"""
    
    # Initialize page configuration
    init_page_config()
    
    # Initialize Database (Run once)
    try:
        if 'db_initialized' not in st.session_state:
            initialize_database()
            st.session_state['db_initialized'] = True
    except Exception as e:
        print(f"Database initialization warning: {e}")
    
    # Apply custom styles
    apply_custom_styles()
    
    # Check VectorWave availability (without blocking initialization)
    vectorwave_available = check_vectorwave_availability()
    
    # Render header
    render_header(vectorwave_available)
    
    # Render sidebar and get filters
    sidebar_state = render_sidebar(vectorwave_available)
    
    # Handle refresh
    if sidebar_state.get('refresh_triggered'):
        clear_all_caches()
        st.rerun()
    
    # Render main tabs
    render_tabs(sidebar_state, vectorwave_available)
    
    # Footer
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.markdown(f"""
    <div style='text-align: center; color: #666; padding: 2rem;'>
        VectorWave Dashboard v1.0 | Last updated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    </div>
    """, unsafe_allow_html=True)
    
    # Auto-refresh logic
    if sidebar_state.get('auto_refresh'):
        import time
        time.sleep(sidebar_state.get('refresh_interval', 10))
        print("Auto-refresh triggered")
        st.rerun()

if __name__ == "__main__":
    main()
