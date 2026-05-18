from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=10)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        from app.models import db_models  # noqa: import triggers model registration
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized ✅")


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
