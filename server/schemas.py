"""Pydantic schemas for vault CRUD API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class PasswordBody(BaseModel):
    password: str = Field(min_length=8)


class AuthStatus(BaseModel):
    setup_required: bool
    unlocked: bool


class AssetIn(BaseModel):
    name: str
    type: str = "other"
    quantity: float = 1
    unit: str = ""
    cost_vnd: float = 0
    current_value_vnd: float = 0
    note: str = ""


class AssetOut(AssetIn):
    id: int
    updated_at: str


class TransactionIn(BaseModel):
    date: str
    amount_vnd: float
    category: str = ""
    direction: Literal["in", "out"]
    note: str = ""
    asset_id: int | None = None


class TransactionOut(TransactionIn):
    id: int
    created_at: str


class SalaryIn(BaseModel):
    period_ym: str
    gross: float = 0
    net: float = 0
    dependents: int = 0
    note: str = ""


class SalaryOut(SalaryIn):
    id: int
    created_at: str


class DebtIn(BaseModel):
    name: str
    principal_vnd: float = 0
    balance_vnd: float = 0
    rate_year: float = 0
    note: str = ""


class DebtOut(DebtIn):
    id: int
    updated_at: str


class ToolInfo(BaseModel):
    id: str
    title: str
    category: str
    status: str


class ToolRunIn(BaseModel):
    params: dict[str, Any] = Field(default_factory=dict)


class ToolRunOut(BaseModel):
    id: int
    tool_id: str
    input: dict[str, Any]
    output: dict[str, Any]
    created_at: str


class SummaryOut(BaseModel):
    assets_total_vnd: float
    debts_total_vnd: float
    net_worth_vnd: float
    asset_count: int
    debt_count: int
    transaction_count: int
    salary_count: int
