#!/usr/bin/env python3
import uvicorn
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # Get port from environment variable (for Render deployment)
    port = int(os.environ.get("PORT", 8080))
    
    # Disable reload in production
    is_production = os.environ.get("RENDER", False)
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=not is_production,
        log_level="info"
    )