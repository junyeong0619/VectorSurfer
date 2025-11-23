"""
Registered functions tab
"""
import streamlit as st
import pandas as pd
from typing import Dict, Any
from data.vectorwave_client import fetch_registered_functions, fetch_function_stats
from config.settings import get_time_range_minutes

def render_functions_tab(sidebar_state: Dict[str, Any], vectorwave_available: bool):
    """Render the registered functions tab"""
    
    st.markdown("### ⚙️ Registered Functions")
    
    if not vectorwave_available:
        st.warning("⚠️ VectorWave is not available. Please check your configuration.")
        return
    
    functions = fetch_registered_functions()
    
    if not functions:
        st.info("No registered functions found")
        return
    
    time_range = sidebar_state.get('time_range', 'Last 1 hour')
    time_range_minutes = get_time_range_minutes(time_range)
    
    # Get execution stats
    all_executions = fetch_function_stats(time_range_minutes)
    
    # Build function stats
    func_stats = []
    
    for func in functions:
        func_name = func.get('function_name', 'Unknown')
        
        # Calculate stats from executions
        if all_executions:
            func_execs = [e for e in all_executions if e.get('function_name') == func_name]
            
            total = len(func_execs)
            success = sum(1 for e in func_execs if e.get('status') == 'SUCCESS')
            durations = [e.get('duration_ms', 0) for e in func_execs if e.get('duration_ms')]
            avg_duration = sum(durations) / len(durations) if durations else 0
            
            func_stats.append({
                'Function Name': func_name,
                'Module': func.get('module_name', 'N/A'),
                'Description': (func.get('search_description', 'N/A')[:50] + "...") 
                              if len(func.get('search_description', '')) > 50 
                              else func.get('search_description', 'N/A'),
                'Executions': total,
                'Avg Duration': f"{avg_duration:.0f}ms" if total > 0 else "N/A",
                'Success Rate': f"{(success/total*100):.1f}%" if total > 0 else "N/A"
            })
        else:
            func_stats.append({
                'Function Name': func_name,
                'Module': func.get('module_name', 'N/A'),
                'Description': (func.get('search_description', 'N/A')[:50] + "...") 
                              if len(func.get('search_description', '')) > 50 
                              else func.get('search_description', 'N/A'),
                'Executions': 0,
                'Avg Duration': "N/A",
                'Success Rate': "N/A"
            })
    
    df_functions = pd.DataFrame(func_stats)
    st.dataframe(df_functions, use_container_width=True, hide_index=True)
