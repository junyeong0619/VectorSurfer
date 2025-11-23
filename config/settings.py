"""
Configuration settings for VectorWave Dashboard
"""
import streamlit as st
import sys
import os

# VectorWave availability flag
VECTORWAVE_AVAILABLE = False

def init_page_config():
    """Initialize Streamlit page configuration"""
    st.set_page_config(
        page_title="VectorWave Dashboard",
        page_icon="🌊",
        layout="wide",
        initial_sidebar_state="expanded"
    )

def setup_vectorwave_path():
    """Add VectorWave to Python path if needed"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    # In vector_setup, we might need to adjust this if the library is not installed in site-packages
    # But based on app.py, it seems to rely on installed package or local import
    sys.path.append(os.getcwd())

def check_vectorwave_availability():
    """Check if VectorWave is available and properly configured"""
    global VECTORWAVE_AVAILABLE
    
    setup_vectorwave_path()
    
    try:
        # Just import - don't initialize
        from vectorwave.utils.status import get_registered_functions, get_db_status
        
        # Try a simple query to test connection
        try:
            # We can check if we can get registered functions
            funcs = get_registered_functions()
            VECTORWAVE_AVAILABLE = get_db_status()
            # st.success("✅ Connected to VectorWave database")
            return get_db_status()
        except Exception as db_error:
            st.warning(f"⚠️ Database connection failed: {db_error}")
            VECTORWAVE_AVAILABLE = False
            return False
            
    except ImportError as e:
        st.error(f"⚠️ VectorWave import failed: {e}")
        st.info("Please ensure VectorWave is installed: `pip install vectorwave`")
        VECTORWAVE_AVAILABLE = False
        return False
    except Exception as e:
        st.error(f"❌ Unexpected error: {e}")
        VECTORWAVE_AVAILABLE = False
        return False

def get_time_range_options():
    """Get available time range options"""
    return [
        "Last 5 minutes",
        "Last 15 minutes", 
        "Last 1 hour",
        "Last 6 hours",
        "Last 24 hours",
        "Last 7 days"
    ]

def get_time_range_minutes(time_range: str) -> int:
    """Convert time range string to minutes"""
    mapping = {
        "Last 5 minutes": 5,
        "Last 15 minutes": 15,
        "Last 1 hour": 60,
        "Last 6 hours": 360,
        "Last 24 hours": 1440,
        "Last 7 days": 10080
    }
    return mapping.get(time_range, 60)

def get_status_options():
    """Get available status filter options"""
    return ["SUCCESS", "ERROR", "WARNING", "ANOMALY"]
