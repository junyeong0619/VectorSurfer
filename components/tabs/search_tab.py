"""
Search tab component with Trace Visualization
"""
import streamlit as st
from typing import Dict, Any
from data.vectorwave_client import search_data, get_trace_details
from .tracer_viewer import render_trace_waterfall

def render_search_tab(sidebar_state: Dict[str, Any], vectorwave_available: bool):
    """Render the search tab"""

    st.markdown("### 🔍 Semantic Search")

    if not vectorwave_available:
        st.warning("⚠️ VectorWave is not available. Please check your configuration.")
        return

    col1, col2 = st.columns([3, 1])

    with col1:
        query = st.text_input("Search query", placeholder="Describe function or error context...")

    with col2:
        search_type = st.selectbox("Search Type", ["Functions", "Executions"])

    if query:
        st.markdown("---")
        results = search_data(query, search_type)

        if results:
            st.success(f"Found {len(results)} results")
            # [수정] enumerate를 사용하여 인덱스(i)를 함께 가져옵니다.
            for i, res in enumerate(results):
                # [수정] 최상위에 없으면 'properties' 내부에서 'function_name'을 찾음
                title = res.get('function_name')
                if not title:
                    title = res.get('properties', {}).get('function_name', 'Unknown')
                if search_type == "Functions":
                    metadata = res.get('metadata', {})
                    score = 0.0  # 기본값 설정

                    # 1. metadata가 객체인 경우 (속성으로 접근)
                    if hasattr(metadata, 'distance'):
                        # 값이 None일 수 있으므로 체크
                        if metadata.distance is not None:
                            score = metadata.distance

                    # 2. metadata가 딕셔너리인 경우 (키로 접근)
                    elif isinstance(metadata, dict):
                        val = metadata.get('distance')
                        if val is not None:
                            score = val

                    # title 변수 포맷팅 (이제 score는 항상 숫자임이 보장됨)
                    title = f"📦 {title} (Distance: {score:.4f})"
                else:
                    status = res.get('status', 'UNKNOWN')
                    icon = "✅" if status == 'SUCCESS' else "❌" if status == 'ERROR' else "⚡"
                    trace_id_short = res.get('trace_id', 'N/A')[:8]
                    title = f"{icon} {title} [Trace: {trace_id_short}...]"

                with st.expander(title):
                    # If it's an execution log with a Trace ID, show the waterfall option
                    trace_id = res.get('trace_id')

                    if search_type == "Executions" and trace_id:
                        tab1, tab2 = st.tabs(["📄 Raw Data", "🌊 Trace Waterfall"])

                        with tab1:
                            st.json(res)

                        with tab2:
                            # [수정] key에 인덱스 'i'를 추가하여 고유성 보장 (btn_0_None, btn_1_None 등으로 생성됨)
                            if st.button(f"Load Trace {trace_id[:8]}", key=f"btn_{i}_{res.get('uuid', 'unknown')}"):
                                with st.spinner("Loading trace details..."):
                                    spans = get_trace_details(trace_id)
                                    render_trace_waterfall(spans)
                    else:
                        st.json(res)
        else:
            st.warning("No results found")