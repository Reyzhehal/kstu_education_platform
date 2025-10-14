import asyncio
import logging

from sqlmodel import Session

from app.core.db import engine, init_db, init_db_async

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    with Session(engine) as session:
        init_db(session)


async def ainit() -> None:
    await init_db_async()


def main() -> None:
    logger.info("Creating initial data")
    try:
        asyncio.run(ainit())
    except RuntimeError:
        # Fallback if event loop already running (e.g., in certain environments)
        import nest_asyncio

        nest_asyncio.apply()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(ainit())
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
