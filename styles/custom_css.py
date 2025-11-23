"""
Custom CSS styles for VectorWave Dashboard
"""
import streamlit as st

def apply_custom_styles():
    """Apply custom CSS styling to the dashboard"""
    st.markdown("""
    <style>
        /* Main theme colors */
        :root {
            --primary-bg: #1e1e1e;
            --secondary-bg: #2e2e2e;
            --card-bg: #252525;
            --border-color: #3e3e3e;
            --text-primary: #e0e0e0;
            --text-secondary: #a0a0a0;
            --accent-blue: #4a9eff;
            --accent-green: #52c41a;
            --accent-red: #ff4d4f;
            --accent-yellow: #faad14;
        }
        
        /* Global styles */
        .stApp {
            background-color: var(--primary-bg);
        }
        
        /* Hide streamlit branding */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        
        /* Custom header */
        .dashboard-header {
            background: linear-gradient(135deg, var(--secondary-bg) 0%, var(--card-bg) 100%);
            padding: 1.5rem 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .dashboard-title {
            color: var(--text-primary);
            font-size: 2rem;
            font-weight: 600;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .dashboard-subtitle {
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-top: 0.3rem;
        }
        
        /* Metric cards */
        .metric-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
            height: 100%;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .metric-label {
            color: var(--text-secondary);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        
        .metric-value {
            color: var(--text-primary);
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.3rem;
        }
        
        .metric-change {
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        
        .metric-change.positive {
            color: var(--accent-green);
        }
        
        .metric-change.negative {
            color: var(--accent-red);
        }
        
        /* Chart containers */
        .chart-container {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .chart-title {
            color: var(--text-primary);
            font-size: 1.1rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }
        
        /* Sidebar styling */
        section[data-testid="stSidebar"] {
            background-color: var(--secondary-bg);
            border-right: 1px solid var(--border-color);
        }
        
        section[data-testid="stSidebar"] > div {
            padding-top: 2rem;
        }
        
        /* Buttons */
        .stButton > button {
            background-color: var(--accent-blue);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.5rem 1.5rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .stButton > button:hover {
            background-color: #3a8eef;
            box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
        }
        
        /* Tables */
        .dataframe {
            background-color: var(--card-bg) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
        }
        
        /* Status badges */
        .status-success {
            color: var(--accent-green);
        }
        
        .status-error {
            color: var(--accent-red);
        }
        
        .status-warning {
            color: var(--accent-yellow);
        }
        
        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {
            gap: 2rem;
            background-color: var(--secondary-bg);
            padding: 0.5rem 1rem;
            border-radius: 8px;
        }
        
        .stTabs [data-baseweb="tab"] {
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .stTabs [aria-selected="true"] {
            color: var(--accent-blue);
        }
    </style>
    """, unsafe_allow_html=True)
