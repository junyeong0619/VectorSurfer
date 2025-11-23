# VectorSurfer Dashboard

A **premium**, **modern** Streamlit dashboard that visualizes VectorSurfer data with a sleek dark theme, glass‑morphism cards, and interactive tabs.

## Features
- Dashboard Overview, Analytics, Search, and Functions tabs
- Auto‑refresh and custom time‑range filters
- Custom CSS for a polished UI (see `styles/custom_css.py`)
- Backend integration via `data/vectorwave_client.py`

## Quick Start
```bash
# Clone the repo
git clone https://github.com/Cozymori/vectorsurfer.git
cd vectorsurfer

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

The app will be available at `http://localhost:8503`.

## Screenshots
![Dashboard Screenshot](/.github/screenshot.png)

## Project Structure
```
vectorsurfer/
├─ app.py                 # Main entry point
├─ components/            # UI components (header, sidebar, tabs)
├─ config/                # Settings and initialization
├─ data/                  # VectorSurfer client wrapper
├─ styles/                # Custom CSS
├─ utils/                 # Helper utilities
└─ requirements.txt       # Python dependencies
```

## License
MIT © 2025
