"""
Dashboard header component
"""
import streamlit as st

def render_header(vectorwave_available: bool):
    """
    Render the dashboard header
    
    Args:
        vectorwave_available: Whether VectorWave is available and connected
    """
    db_status_icon = "🟢" if vectorwave_available else "🔴"
    
    st.markdown(f"""
    <div class="dashboard-header">
        <h1 class="dashboard-title">
            🌊 VectorWave Dashboard {db_status_icon}
        </h1>
        <p class="dashboard-subtitle">
            Real-time monitoring and analytics for your vector-based application observability
        </p>
    </div>
    """, unsafe_allow_html=True)
