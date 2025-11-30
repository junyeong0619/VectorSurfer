"""
Overview tab component - Main dashboard metrics, charts, and AI Doctor
"""
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from typing import Dict, Any

from config.settings import get_time_range_minutes
from data.vectorwave_client import (
    fetch_metrics,
    fetch_timeline_data,
    fetch_recent_errors_data,
    run_ai_analysis
)
from utils.formatters import format_number, format_percentage

def render_overview_tab(sidebar_state: Dict[str, Any], vectorwave_available: bool):
    """Render the overview tab with key metrics and charts"""

    st.markdown("### Key Metrics")

    if not vectorwave_available:
        st.warning("⚠️ VectorWave is not available. Please check your configuration.")
        return

    time_range = sidebar_state.get('time_range', 'Last 1 hour')
    time_range_minutes = get_time_range_minutes(time_range)

    # Fetch metrics
    metrics = fetch_metrics(time_range_minutes)

    # Render metric cards
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Total Executions</div>
            <div class="metric-value">{format_number(metrics['total_executions'])}</div>
            <div class="metric-change">
                Last {time_range.lower()}
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        success_rate = metrics['success_rate']
        health_status = 'positive' if success_rate >= 95 else 'negative'
        health_text = '✓ Healthy' if success_rate >= 95 else '⚠ Needs attention'

        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Success Rate</div>
            <div class="metric-value">{format_percentage(success_rate)}</div>
            <div class="metric-change {health_status}">
                {health_text}
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Avg Response Time</div>
            <div class="metric-value">{metrics['avg_duration']:.0f}ms</div>
            <div class="metric-change">
                Average duration
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Active Functions</div>
            <div class="metric-value">{metrics['active_functions']}</div>
            <div class="metric-change">
                {metrics['error_count']} errors
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Charts section
    col1, col2 = st.columns(2)

    with col1:
        render_timeline_chart(time_range_minutes)

    with col2:
        render_duration_distribution_chart(time_range_minutes)

    # Recent errors and AI Doctor
    render_recent_errors_section(time_range_minutes)

def render_timeline_chart(time_range_minutes: int):
    """Render execution timeline chart"""
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Execution Timeline</div>', unsafe_allow_html=True)

    executions = fetch_timeline_data(time_range_minutes)

    if executions:
        df = pd.DataFrame(executions)
        if 'timestamp_utc' in df.columns:
            df['timestamp_utc'] = pd.to_datetime(df['timestamp_utc'])
            df = df.set_index('timestamp_utc')

            # Group by minute and status
            timeline = df.groupby([pd.Grouper(freq='1min'), 'status']).size().unstack(fill_value=0)
            timeline = timeline.reset_index()

            fig = go.Figure()

            if 'SUCCESS' in timeline.columns:
                fig.add_trace(go.Scatter(
                    x=timeline['timestamp_utc'],
                    y=timeline['SUCCESS'],
                    name='Success',
                    mode='lines+markers',
                    line=dict(color='#52c41a', width=2),
                    marker=dict(size=4)
                ))

            if 'ERROR' in timeline.columns:
                fig.add_trace(go.Scatter(
                    x=timeline['timestamp_utc'],
                    y=timeline['ERROR'],
                    name='Error',
                    mode='lines+markers',
                    line=dict(color='#ff4d4f', width=2),
                    marker=dict(size=4)
                ))

            fig.update_layout(
                template='plotly_dark',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                margin=dict(l=0, r=0, t=0, b=0),
                height=300,
                showlegend=True,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                xaxis_title="Time",
                yaxis_title="Count"
            )

            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No timestamp data available")
    else:
        st.info("No execution data available for the selected time range")

    st.markdown('</div>', unsafe_allow_html=True)

def render_duration_distribution_chart(time_range_minutes: int):
    """Render response time distribution chart"""
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Response Time Distribution</div>', unsafe_allow_html=True)

    executions = fetch_timeline_data(time_range_minutes)

    if executions:
        durations = [e.get('duration_ms', 0) for e in executions
                     if e.get('duration_ms') and e.get('status') == 'SUCCESS']

        if durations:
            # Create bins
            bins = [0, 50, 100, 200, 500, float('inf')]
            labels = ['0-50ms', '50-100ms', '100-200ms', '200-500ms', '500ms+']
            counts = [0] * len(labels)

            for d in durations:
                for i, (low, high) in enumerate(zip(bins[:-1], bins[1:])):
                    if low <= d < high:
                        counts[i] += 1
                        break

            fig = go.Figure(data=[
                go.Bar(
                    x=labels,
                    y=counts,
                    marker_color='#4a9eff'
                )
            ])

            fig.update_layout(
                template='plotly_dark',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                margin=dict(l=0, r=0, t=0, b=0),
                height=300,
                showlegend=False,
                xaxis_title="Duration Range",
                yaxis_title="Count"
            )

            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No duration data available")
    else:
        st.info("No execution data available")

    st.markdown('</div>', unsafe_allow_html=True)

def render_recent_errors_section(time_range_minutes: int):
    """Render recent errors table and AI Doctor interface"""
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Recent Errors & AI Doctor</div>', unsafe_allow_html=True)

    errors = fetch_recent_errors_data(limit=10, minutes_ago=time_range_minutes)

    if errors:
        error_data = []
        for e in errors:
            error_data.append({
                'Timestamp': e.get('timestamp_utc', 'N/A'),
                'Function': e.get('function_name', 'Unknown'),
                'Error Code': e.get('error_code', 'UNKNOWN'),
                'Duration': f"{e.get('duration_ms', 0):.0f}ms",
                'Trace ID': e.get('trace_id', 'N/A')
            })

        df_errors = pd.DataFrame(error_data)
        st.dataframe(df_errors, use_container_width=True, hide_index=True)

        st.markdown("---")
        st.markdown("#### 🤖 AI Doctor Diagnosis")

        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            # Extract Trace ID from the first error if available
            default_trace = df_errors.iloc[0]['Trace ID'] if not df_errors.empty else ""
            trace_id_input = st.text_input("Trace ID to Analyze", value=default_trace, placeholder="Paste Trace ID here...")

        with col2:
            language = st.selectbox("Language", ["English", "Korean"], index=0)
            lang_code = "en" if language == "English" else "ko"

        with col3:
            st.write("") # Spacing
            st.write("")
            analyze_btn = st.button("🩺 Analyze Error", use_container_width=True)

        if analyze_btn and trace_id_input:
            with st.spinner("AI is analyzing the trace logs..."):
                analysis_result = run_ai_analysis(trace_id_input, language=lang_code)

            st.info("Analysis Complete")
            st.markdown(f"**Diagnosis Result:**\n\n{analysis_result}")

    else:
        st.success("✅ No recent errors found!")

    st.markdown('</div>', unsafe_allow_html=True)