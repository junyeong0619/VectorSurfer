"""
Trace Waterfall Viewer Component
Visualizes distributed tracing data using a Gantt chart style
"""
import streamlit as st
import pandas as pd
import plotly.express as px
from typing import List, Dict, Any


def render_trace_waterfall(spans: List[Dict[str, Any]]):
    """
    Render a Gantt chart-style waterfall for a trace

    Args:
        spans: List of span dictionaries containing trace data
    """
    if not spans:
        st.info("No trace spans available to display.")
        return

    st.markdown("#### 🌊 Trace Waterfall")

    try:
        # Data Preprocessing
        df = pd.DataFrame(spans)

        # Ensure timestamp exists and convert
        if 'timestamp_utc' not in df.columns:
            st.warning("Trace data missing timestamps.")
            return

        df['Start'] = pd.to_datetime(df['timestamp_utc'])
        # Calculate End time based on duration (default to 1ms if 0 to show on chart)
        df['Duration_Chart'] = df['duration_ms'].apply(lambda x: max(x, 1))
        df['End'] = df['Start'] + pd.to_timedelta(df['Duration_Chart'], unit='ms')

        # Create meaningful labels
        df['Label'] = df.apply(
            lambda x: f"{x['function_name']} ({x['duration_ms']:.1f}ms)", axis=1
        )

        # Color mapping for statuses
        color_map = {
            'SUCCESS': '#4a9eff',  # Blue
            'ERROR': '#ff4d4f',  # Red
            'CACHE_HIT': '#52c41a',  # Green
            'WARNING': '#faad14',  # Yellow
            'ANOMALY': '#d4380d'  # Dark Orange
        }

        # Determine height based on number of spans
        chart_height = 250 + (len(df) * 30)

        # Create Gantt Chart
        fig = px.timeline(
            df,
            x_start="Start",
            x_end="End",
            y="function_name",
            color="status",
            color_discrete_map=color_map,
            hover_data={
                "duration_ms": True,
                "error_message": True,
                "span_id": False,
                "Start": False,
                "End": False
            },
            title=f"Trace ID: {spans[0].get('trace_id', 'Unknown')[:8]}..."
        )

        # Reverse Y-axis to show chronological order top-to-bottom
        fig.update_yaxes(autorange="reversed", title="Function Span")
        fig.update_xaxes(title="Time (UTC)")

        fig.update_layout(
            template='plotly_dark',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=chart_height,
            margin=dict(l=10, r=10, t=40, b=10),
            legend_title_text='Status'
        )

        st.plotly_chart(fig, use_container_width=True)

        # Expandable Details
        with st.expander("🔍 View Raw Trace Logs"):
            # Display important columns first
            cols = ['function_name', 'status', 'duration_ms', 'error_code', 'span_id', 'parent_span_id']
            cols = [c for c in cols if c in df.columns]
            st.dataframe(df[cols], use_container_width=True, hide_index=True)

    except Exception as e:
        st.error(f"Failed to render trace waterfall: {e}")
