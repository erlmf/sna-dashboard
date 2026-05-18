from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import network, influencers, communities, analytics
from app.core.config import settings
from app.core.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and load graph on startup."""
    logger.info("Starting SNA Instagram API...")
    await init_db()
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Instagram SNA API",
    description="Social Network Analysis API for Instagram data",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(network.router,     prefix="/api/network",     tags=["Network"])
app.include_router(influencers.router, prefix="/api/influencers", tags=["Influencers"])
app.include_router(communities.router, prefix="/api/communities", tags=["Communities"])
app.include_router(analytics.router,  prefix="/api/analytics",   tags=["Analytics"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
