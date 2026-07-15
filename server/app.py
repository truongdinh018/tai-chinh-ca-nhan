"""FastAPI app — Personal Finance Island vault API."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.routers import assets, auth, debts, salary, summary, tools, transactions

app = FastAPI(title="Tài chính cá nhân — Vault API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(transactions.router)
app.include_router(salary.router)
app.include_router(debts.router)
app.include_router(summary.router)
app.include_router(tools.router)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}
