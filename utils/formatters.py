"""
Formatting utilities
"""

def format_number(num):
    """Format number with K/M suffixes"""
    if num >= 1000000:
        return f"{num/1000000:.1f}M"
    if num >= 1000:
        return f"{num/1000:.1f}K"
    return str(num)

def format_percentage(val):
    """Format percentage"""
    return f"{val:.1f}%"

def format_duration(ms):
    """Format duration in ms/s"""
    if ms >= 1000:
        return f"{ms/1000:.2f}s"
    return f"{ms:.0f}ms"
