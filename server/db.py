"""Row helpers and repository queries."""

from __future__ import annotations

import json
from typing import Any


def row_to_dict(row: Any) -> dict[str, Any]:
    return {k: row[k] for k in row.keys()}


def list_assets(conn: Any) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT * FROM assets ORDER BY id DESC"
    ).fetchall()
    return [row_to_dict(r) for r in rows]


def get_asset(conn: Any, asset_id: int) -> dict[str, Any] | None:
    row = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    return row_to_dict(row) if row else None


def create_asset(conn: Any, data: dict[str, Any]) -> dict[str, Any]:
    cur = conn.execute(
        """
        INSERT INTO assets(name, type, quantity, unit, cost_vnd, current_value_vnd, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data["name"],
            data["type"],
            data["quantity"],
            data["unit"],
            data["cost_vnd"],
            data["current_value_vnd"],
            data["note"],
        ),
    )
    conn.commit()
    return get_asset(conn, cur.lastrowid)  # type: ignore[return-value]


def update_asset(conn: Any, asset_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    existing = get_asset(conn, asset_id)
    if not existing:
        return None
    conn.execute(
        """
        UPDATE assets SET
            name = ?, type = ?, quantity = ?, unit = ?,
            cost_vnd = ?, current_value_vnd = ?, note = ?,
            updated_at = datetime('now')
        WHERE id = ?
        """,
        (
            data["name"],
            data["type"],
            data["quantity"],
            data["unit"],
            data["cost_vnd"],
            data["current_value_vnd"],
            data["note"],
            asset_id,
        ),
    )
    conn.commit()
    return get_asset(conn, asset_id)


def delete_asset(conn: Any, asset_id: int) -> bool:
    cur = conn.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
    conn.commit()
    return cur.rowcount > 0


def list_transactions(conn: Any) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT * FROM transactions ORDER BY date DESC, id DESC"
    ).fetchall()
    return [row_to_dict(r) for r in rows]


def get_transaction(conn: Any, tx_id: int) -> dict[str, Any] | None:
    row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    return row_to_dict(row) if row else None


def create_transaction(conn: Any, data: dict[str, Any]) -> dict[str, Any]:
    cur = conn.execute(
        """
        INSERT INTO transactions(date, amount_vnd, category, direction, note, asset_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            data["date"],
            data["amount_vnd"],
            data["category"],
            data["direction"],
            data["note"],
            data.get("asset_id"),
        ),
    )
    conn.commit()
    return get_transaction(conn, cur.lastrowid)  # type: ignore[return-value]


def update_transaction(conn: Any, tx_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    if not get_transaction(conn, tx_id):
        return None
    conn.execute(
        """
        UPDATE transactions SET
            date = ?, amount_vnd = ?, category = ?, direction = ?, note = ?, asset_id = ?
        WHERE id = ?
        """,
        (
            data["date"],
            data["amount_vnd"],
            data["category"],
            data["direction"],
            data["note"],
            data.get("asset_id"),
            tx_id,
        ),
    )
    conn.commit()
    return get_transaction(conn, tx_id)


def delete_transaction(conn: Any, tx_id: int) -> bool:
    cur = conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    return cur.rowcount > 0


def list_salary(conn: Any) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT * FROM salary_records ORDER BY period_ym DESC, id DESC"
    ).fetchall()
    return [row_to_dict(r) for r in rows]


def get_salary(conn: Any, salary_id: int) -> dict[str, Any] | None:
    row = conn.execute(
        "SELECT * FROM salary_records WHERE id = ?", (salary_id,)
    ).fetchone()
    return row_to_dict(row) if row else None


def create_salary(conn: Any, data: dict[str, Any]) -> dict[str, Any]:
    cur = conn.execute(
        """
        INSERT INTO salary_records(period_ym, gross, net, dependents, note)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            data["period_ym"],
            data["gross"],
            data["net"],
            data["dependents"],
            data["note"],
        ),
    )
    conn.commit()
    return get_salary(conn, cur.lastrowid)  # type: ignore[return-value]


def update_salary(conn: Any, salary_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    if not get_salary(conn, salary_id):
        return None
    conn.execute(
        """
        UPDATE salary_records SET
            period_ym = ?, gross = ?, net = ?, dependents = ?, note = ?
        WHERE id = ?
        """,
        (
            data["period_ym"],
            data["gross"],
            data["net"],
            data["dependents"],
            data["note"],
            salary_id,
        ),
    )
    conn.commit()
    return get_salary(conn, salary_id)


def delete_salary(conn: Any, salary_id: int) -> bool:
    cur = conn.execute("DELETE FROM salary_records WHERE id = ?", (salary_id,))
    conn.commit()
    return cur.rowcount > 0


def list_debts(conn: Any) -> list[dict[str, Any]]:
    rows = conn.execute("SELECT * FROM debts ORDER BY id DESC").fetchall()
    return [row_to_dict(r) for r in rows]


def get_debt(conn: Any, debt_id: int) -> dict[str, Any] | None:
    row = conn.execute("SELECT * FROM debts WHERE id = ?", (debt_id,)).fetchone()
    return row_to_dict(row) if row else None


def create_debt(conn: Any, data: dict[str, Any]) -> dict[str, Any]:
    cur = conn.execute(
        """
        INSERT INTO debts(name, principal_vnd, balance_vnd, rate_year, note)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            data["name"],
            data["principal_vnd"],
            data["balance_vnd"],
            data["rate_year"],
            data["note"],
        ),
    )
    conn.commit()
    return get_debt(conn, cur.lastrowid)  # type: ignore[return-value]


def update_debt(conn: Any, debt_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    if not get_debt(conn, debt_id):
        return None
    conn.execute(
        """
        UPDATE debts SET
            name = ?, principal_vnd = ?, balance_vnd = ?, rate_year = ?, note = ?,
            updated_at = datetime('now')
        WHERE id = ?
        """,
        (
            data["name"],
            data["principal_vnd"],
            data["balance_vnd"],
            data["rate_year"],
            data["note"],
            debt_id,
        ),
    )
    conn.commit()
    return get_debt(conn, debt_id)


def delete_debt(conn: Any, debt_id: int) -> bool:
    cur = conn.execute("DELETE FROM debts WHERE id = ?", (debt_id,))
    conn.commit()
    return cur.rowcount > 0


def summary(conn: Any) -> dict[str, Any]:
    assets_total = conn.execute(
        "SELECT COALESCE(SUM(current_value_vnd), 0) AS t FROM assets"
    ).fetchone()["t"]
    debts_total = conn.execute(
        "SELECT COALESCE(SUM(balance_vnd), 0) AS t FROM debts"
    ).fetchone()["t"]
    return {
        "assets_total_vnd": float(assets_total),
        "debts_total_vnd": float(debts_total),
        "net_worth_vnd": float(assets_total) - float(debts_total),
        "asset_count": conn.execute("SELECT COUNT(*) AS c FROM assets").fetchone()["c"],
        "debt_count": conn.execute("SELECT COUNT(*) AS c FROM debts").fetchone()["c"],
        "transaction_count": conn.execute(
            "SELECT COUNT(*) AS c FROM transactions"
        ).fetchone()["c"],
        "salary_count": conn.execute(
            "SELECT COUNT(*) AS c FROM salary_records"
        ).fetchone()["c"],
    }


def save_tool_run(
    conn: Any, tool_id: str, input_data: dict[str, Any], output_data: dict[str, Any]
) -> dict[str, Any]:
    cur = conn.execute(
        """
        INSERT INTO tool_runs(tool_id, input_json, output_json)
        VALUES (?, ?, ?)
        """,
        (tool_id, json.dumps(input_data, ensure_ascii=False), json.dumps(output_data, ensure_ascii=False)),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM tool_runs WHERE id = ?", (cur.lastrowid,)).fetchone()
    return {
        "id": row["id"],
        "tool_id": row["tool_id"],
        "input": json.loads(row["input_json"]),
        "output": json.loads(row["output_json"]),
        "created_at": row["created_at"],
    }


def import_sample_assets(conn: Any, csv_path: Any) -> int:
    import csv
    from pathlib import Path

    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Sample not found: {path}")
    count = 0
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            create_asset(
                conn,
                {
                    "name": row.get("name", "").strip(),
                    "type": row.get("type", "other").strip() or "other",
                    "quantity": float(row.get("quantity") or 1),
                    "unit": row.get("unit", "") or "",
                    "cost_vnd": float(row.get("cost_vnd") or 0),
                    "current_value_vnd": float(row.get("current_value_vnd") or 0),
                    "note": row.get("note", "") or "",
                },
            )
            count += 1
    return count
