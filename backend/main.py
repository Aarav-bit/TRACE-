import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.session import init_db, SessionLocal
from backend.database.models import Case
from backend.synthetic.cases import seed_synthetic_case
# Import all approved tools to trigger registry initialization
import backend.tools
from backend.api.routes_cases import router as cases_router, demo_router
from backend.api.routes_artifacts import router as artifacts_router, sample_router
from backend.api.routes_investigations import router as investigations_router
from backend.api.routes_evidence import router as evidence_router
from backend.api.routes_tools import router as tools_router
from backend.api.routes_reports import router as reports_router
from backend.api.routes_settings import router as settings_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trace")

# Initialize tables immediately
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    logger.info("Initializing TRACE database tables...")
    init_db()

    # Pre-seed demo cases if clean install
    db = SessionLocal()
    try:
        existing_demo = db.query(Case).filter(Case.is_demo == True).first()
        if not existing_demo:
            logger.info("Fresh database detected: Seeding default synthetic demonstration case (Case A)...")
            seed_synthetic_case(db, case_type="complete")
    finally:
        db.close()

    yield
    logger.info("TRACE backend shutting down.")

app = FastAPI(
    title="TRACE API — Threat Reconstruction & Autonomous Cyber Evidence",
    description="Autonomous digital forensics investigator API with adaptive planning, deterministic verification, and cryptographic provenance.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(cases_router)
app.include_router(demo_router)
app.include_router(sample_router)
app.include_router(artifacts_router)
app.include_router(investigations_router)
app.include_router(evidence_router)
app.include_router(tools_router)
app.include_router(reports_router)
app.include_router(settings_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TRACE Autonomous Digital Forensics Engine",
        "version": "1.0.0",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
