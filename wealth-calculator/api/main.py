"""FastAPI application entry point."""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env if present (local dev convenience)
load_dotenv()

from api.routes import benchmarks, debt, housing, inflation, investments
from api.routes.cortex import router as cortex_router
from api.routes.cortex_extras import router as cortex_extras_router
from api.routes.consumer import router as consumer_router

app = FastAPI(
    title="Wealth Calculator API",
    description="Serves economic benchmark data from Snowflake MARTS tables.",
    version="1.0.0",
)

# CORS — allow the Vite dev server and any production origin you deploy to
_origins = [
    "http://localhost:5173",
    "http://localhost:4173",  # Vite preview
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(benchmarks.router, prefix="/api")
app.include_router(investments.router, prefix="/api")
app.include_router(inflation.router, prefix="/api")
app.include_router(housing.router, prefix="/api")
app.include_router(debt.router, prefix="/api")
app.include_router(cortex_router)
app.include_router(cortex_extras_router)
app.include_router(consumer_router)


@app.get("/health")
def health():
    return {"status": "ok"}
