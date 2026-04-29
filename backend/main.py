import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simple FastAPI + React App")

# --- API Routes ---
@app.get("/api/hello")
async def hello():
    logger.info("Accessed /api/hello")
    return {"message": "Hello from FastAPI!"}

@app.get("/api/health")
async def health_check():
    logger.info("Health check at /api/health")
    return {"status": "healthy"}

@app.get("/api/data")
async def get_data():
    logger.info("Data requested at /api/data")
    data = [
        {"month": "Jan", "Champions": 642, "Active": 781, "Low Engagement": 564},
        {"month": "Feb", "Champions": 658, "Active": 790, "Low Engagement": 543},
        {"month": "Mar", "Champions": 701, "Active": 762, "Low Engagement": 528},
        {"month": "Apr", "Champions": 723, "Active": 745, "Low Engagement": 512},
        {"month": "May", "Champions": 689, "Active": 803, "Low Engagement": 498},
        {"month": "Jun", "Champions": 745, "Active": 778, "Low Engagement": 467},
    ]
    return {
        "data": data,
        "title": "Customer Segments Over Time",
        "x_title": "Month",
        "y_title": "Customers"
    }

# --- Static Files Setup ---
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

# --- Catch-all for React Routes ---
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    index_html = os.path.join(static_dir, "index.html")
    if os.path.exists(index_html):
        logger.info(f"Serving React frontend for path: /{full_path}")
        return FileResponse(index_html)
    logger.error("Frontend not built. index.html missing.")
    raise HTTPException(
        status_code=404,
        detail="Frontend not built. Please run 'npm run build' first."
    )