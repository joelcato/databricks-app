import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
load_dotenv()
from databricks.sdk.core import Config
from databricks import sql


# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simple FastAPI + React App")

def get_connection():
    cfg = Config()
    warehouse_id = os.getenv("DATABRICKS_WAREHOUSE_ID")
    http_path = f"/sql/1.0/warehouses/{warehouse_id}"
    return sql.connect(
        server_hostname=cfg.host,
        http_path=http_path,
        credentials_provider=lambda: cfg.authenticate,
    )

# --- API Routes ---
@app.get("/api/health")
async def health_check():
    logger.info("Health check at /api/health")
    return {"status": "healthy"}

@app.get("/api/data")
async def get_data():
    logger.info("Querying amazon_purchases for segment data")
    query = """
        SELECT
            DATE_FORMAT(`Order Date`, 'yyyy-MM') AS month,
            COUNT(*) AS order_count,
            ROUND(SUM(`Purchase Price Per Unit` * `Quantity`), 2) AS total_spend,
            COUNT(DISTINCT `Survey ResponseID`) AS unique_customers
        FROM customer_analytics_app.default.amazon_purchases
        WHERE `Order Date` IS NOT NULL
        GROUP BY DATE_FORMAT(`Order Date`, 'yyyy-MM')
        ORDER BY month
        LIMIT 24
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]

    data = [dict(zip(columns, row)) for row in rows]

    return {
        "data": data,
        "title": "Monthly Purchase Activity",
        "x_title": "Month",
        "y_title": "Total Spend ($)"
    }

@app.get("/api/sankey")
async def get_sankey():
    logger.info("Querying sankey flow data")
    query = """
        SELECT
            CONCAT(ps.segment_name, ' (', f.prev_periodLabel, ')') AS source,
            CONCAT(cs.segment_name, ' (', f.periodLabel, ')') AS target,
            f.flow_count AS value
        FROM customer_analytics_app.default.rfm_sankey_flows f
        JOIN customer_analytics_app.segmentation.segment_config ps
            ON f.prev_segmentID = ps.segment_id
        JOIN customer_analytics_app.segmentation.segment_config cs
            ON f.segmentID = cs.segment_id
        WHERE f.prev_periodLabel = '2021-11'
        AND f.periodLabel = '2021-12'
        ORDER BY f.flow_count DESC
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]

    raw = [dict(zip(columns, row)) for row in rows]

    # Build Nivo Sankey format: {nodes: [{id}], links: [{source, target, value}]}
    node_ids = set()
    links = []
    for row in raw:
        node_ids.add(row["source"])
        node_ids.add(row["target"])
        links.append({
            "source": row["source"],
            "target": row["target"],
            "value": row["value"],
        })

    nodes = [{"id": nid} for nid in sorted(node_ids)]
    return {"nodes": nodes, "links": links}

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