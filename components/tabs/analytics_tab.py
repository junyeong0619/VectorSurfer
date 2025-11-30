"""
Analytics tab with advanced charts, cost, and efficiency analysis
"""
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from typing import Dict, Any

from config.settings import get_time_range_minutes
from data.vectorwave_client import (
    fetch_function_stats,
    fetch_slowest_executions_data,
    fetch_token_usage,
    fetch_cache_stats
)
from utils.formatters import format_number

def render_analytics_tab(sidebar_state: Dict[str, Any], vectorwave_available: bool):
    """Render the analytics tab"""

    st.markdown("### 📈 Advanced Analytics")

    if not vectorwave_available:
        st.warning("⚠️ VectorWave is not available. Please check your configuration.")
        return

    time_range = sidebar_state.get('time_range', 'Last 1 hour')
    time_range_minutes = get_time_range_minutes(time_range)

    # --- Cost & Efficiency Section ---
    st.markdown("#### 💰 Cost & Efficiency")
    col1, col2, col3 = st.columns(3)

    # 1. Token Usage
    token_stats = fetch_token_usage()
    total_tokens = token_stats.get('total_tokens', 0)

    with col1:
        st.metric(
            label="Total LLM Tokens Used",
            value=format_number(total_tokens),
            help="Total tokens consumed by embedding and generation models"
        )

    # 2. Cache Statistics
    cache_stats = fetch_cache_stats(time_range_minutes)

    with col2:
        st.metric(
            label="Cache Hit Rate",
            value=f"{cache_stats['hit_rate']:.1f}%",
            delta=f"{cache_stats['total_hits']} hits",
            help="Percentage of calls served from semantic cache"
        )

    with col3:
        saved_sec = cache_stats['saved_time_ms'] / 1000
        st.metric(
            label="Est. Time Saved",
            value=f"{saved_sec:.2f}s",
            delta="Optimization",
            help="Estimated latency saved by skipping execution via caching"
        )

    st.markdown("---")

    # --- Charts Section ---
    col1, col2 = st.columns(2)

    with col1:
        render_function_performance_chart(time_range_minutes)

    with col2:
        render_error_rate_chart(time_range_minutes)

    # Slowest executions table
    render_slowest_executions_table()

def render_function_performance_chart(time_range_minutes: int):
    """Render function performance comparison chart"""
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Function Performance Comparison</div>', unsafe_allow_html=True)

    executions = fetch_function_stats(time_range_minutes)

    if executions:
        df = pd.DataFrame(executions)
        perf_data = df.groupby('function_name').agg({
            'duration_ms': 'mean',
            'status': 'count'
        }).reset_index()
        perf_data.columns = ['Function', 'Avg Duration (ms)', 'Total Calls']
        perf_data = perf_data.sort_values('Total Calls', ascending=False).head(10)

        fig = go.Figure(data=[
            go.Bar(
                x=perf_data['Function'],
                y=perf_data['Avg Duration (ms)'],
                marker_color='#4a9eff'
            )
        ])

        fig.update_layout(
            template='plotly_dark',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(l=0, r=0, t=0, b=0),
            height=300,
            xaxis_title="Function",
            yaxis_title="Avg Duration (ms)"
        )

        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No data available")

    st.markdown('</div>', unsafe_allow_html=True)

def render_error_rate_chart(time_range_minutes: int):
    """Render error rate by function chart"""
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Error Rate by Function</div>', unsafe_allow_html=True)

    executions = fetch_function_stats(time_range_minutes)

    if executions:
        df = pd.DataFrame(executions)
        # Check if 'status' column exists to prevent KeyError
        if 'status' not in df.columns:
            st.info("No status data available")
            st.markdown('</div>', unsafe_allow_html=True)
            return

        error_data = df.groupby(['function_name', 'status']).size().unstack(fill_value=0)

        if 'ERROR' in error_data.columns:
            error_data['error_rate'] = (error_data['ERROR'] / error_data.sum(axis=1) * 100)
            error_data = error_data.sort_values('error_rate', ascending=False).head(10)

            fig = go.Figure(data=[
                go.Bar(
                    x=error_data.index,
                    y=error_data['error_rate'],
                    marker_color='#ff4d4f'
                )
            ])

            fig.update_layout(
                template='plotly_dark',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                margin=dict(l=0, r=0, t=0, b=0),
                height=300,
                xaxis_title="Function",
                yaxis_title="Error Rate (%)"
            )

            st.plotly_chart(fig, use_container_width=True)
        else:
            st.success("✅ No errors detected!")
    else:
        st.info("No data available")

    st.markdown('</div>', unsafe_allow_html=True)

def render_slowest_executions_table():
    """Render slowest executions table"""
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Slowest Executions</div>', unsafe_allow_html=True)

    slowest = fetch_slowest_executions_data(limit=10, min_duration_ms=0)

    if slowest:
        slow_df = pd.DataFrame(slowest)
        display_cols = ['timestamp_utc', 'function_name', 'duration_ms', 'status', 'trace_id']
        display_cols = [c for c in display_cols if c in slow_df.columns]
        st.dataframe(slow_df[display_cols], use_container_width=True, hide_index=True)
    else:
        st.info("No execution data available")

    st.markdown('</div>', unsafe_allow_html=True)