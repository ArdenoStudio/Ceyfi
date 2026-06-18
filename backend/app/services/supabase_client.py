import logging
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from datetime import datetime, timezone
from app.config import settings

log = logging.getLogger(__name__)


@contextmanager
def _cursor():
    conn = psycopg2.connect(settings.database_url, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _j(val):
    return psycopg2.extras.Json(val)


def run_migrations():
    sql = """
    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      account_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      amount_lkr FLOAT NOT NULL,
      bucket_id TEXT,
      bucket_label TEXT,
      source TEXT DEFAULT 'mock',
      type TEXT DEFAULT 'debit',
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS allocation_rules (
      id BIGSERIAL PRIMARY KEY,
      sender_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      buckets JSONB NOT NULL DEFAULT '[]',
      UNIQUE(sender_id, account_id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      language TEXT DEFAULT 'en',
      history JSONB NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS tax_jar_rules (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      from_account_id TEXT NOT NULL,
      to_account_id TEXT NOT NULL,
      percentage FLOAT NOT NULL,
      label TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      UNIQUE(user_id, from_account_id)
    );
    CREATE TABLE IF NOT EXISTS demo_state (
      id INTEGER PRIMARY KEY,
      scenario TEXT DEFAULT 'idle',
      last_spend TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS payments (
      id BIGSERIAL PRIMARY KEY,
      order_id TEXT,
      status TEXT,
      gateway_response JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO demo_state (id, scenario, last_spend)
      VALUES (1, 'idle', NULL) ON CONFLICT (id) DO NOTHING;
    INSERT INTO allocation_rules (sender_id, account_id, buckets)
      VALUES ('SEY-USR-001', 'SEY-ACC-002',
              '[{"id":"school","label":"School Fees","pct":40},{"id":"household","label":"Household","pct":40},{"id":"savings","label":"Savings","pct":20}]')
      ON CONFLICT (sender_id, account_id) DO NOTHING;
    INSERT INTO tax_jar_rules (user_id, from_account_id, to_account_id, percentage, label, status)
      VALUES ('SEY-BIZ-001', 'SEY-BIZ-001', 'SEY-SAV-001', 10, 'Tax Savings', 'ACTIVE')
      ON CONFLICT (user_id, from_account_id) DO NOTHING;
    """
    with _cursor() as cur:
        cur.execute(sql)
    log.info("DB migrations applied")


def insert_transaction(account_id: str, merchant: str, amount_lkr: float,
                       bucket_id: str | None = None, bucket_label: str | None = None,
                       source: str = "mock", txn_type: str = "debit") -> dict:
    now = datetime.now(timezone.utc).isoformat()
    with _cursor() as cur:
        cur.execute(
            """INSERT INTO transactions
               (account_id, merchant, amount_lkr, bucket_id, bucket_label, source, type, timestamp)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (account_id, merchant, amount_lkr, bucket_id, bucket_label, source, txn_type, now),
        )
        return dict(cur.fetchone() or {})


def save_allocation_rule(sender_id: str, account_id: str, buckets: list[dict]) -> dict:
    with _cursor() as cur:
        cur.execute(
            """INSERT INTO allocation_rules (sender_id, account_id, buckets)
               VALUES (%s, %s, %s)
               ON CONFLICT (sender_id, account_id) DO UPDATE SET buckets = EXCLUDED.buckets
               RETURNING *""",
            (sender_id, account_id, _j(buckets)),
        )
        return dict(cur.fetchone() or {})


def get_allocation_rules(sender_id: str, account_id: str) -> dict | None:
    with _cursor() as cur:
        cur.execute(
            "SELECT * FROM allocation_rules WHERE sender_id = %s AND account_id = %s LIMIT 1",
            (sender_id, account_id),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def save_session(user_id: str, language: str, history: list[dict]) -> None:
    with _cursor() as cur:
        cur.execute(
            """INSERT INTO sessions (user_id, language, history) VALUES (%s, %s, %s)
               ON CONFLICT (user_id) DO UPDATE
               SET language = EXCLUDED.language, history = EXCLUDED.history""",
            (user_id, language, _j(history)),
        )


def save_tax_jar_rule(user_id: str, from_account_id: str, to_account_id: str,
                      percentage: float, label: str) -> dict:
    with _cursor() as cur:
        cur.execute(
            """INSERT INTO tax_jar_rules
               (user_id, from_account_id, to_account_id, percentage, label, status)
               VALUES (%s, %s, %s, %s, %s, 'ACTIVE')
               ON CONFLICT (user_id, from_account_id) DO UPDATE
               SET to_account_id = EXCLUDED.to_account_id,
                   percentage = EXCLUDED.percentage,
                   label = EXCLUDED.label,
                   status = 'ACTIVE'
               RETURNING *""",
            (user_id, from_account_id, to_account_id, percentage, label),
        )
        return dict(cur.fetchone() or {})


def get_tax_jar_rule(user_id: str) -> dict | None:
    with _cursor() as cur:
        cur.execute(
            "SELECT * FROM tax_jar_rules WHERE user_id = %s AND status = 'ACTIVE' LIMIT 1",
            (user_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def get_recent_transactions(
    account_id: str,
    limit: int = 20,
    *,
    ascending: bool = False,
    source: str | None = None,
) -> list[dict]:
    order = "ASC" if ascending else "DESC"
    with _cursor() as cur:
        if source is not None:
            cur.execute(
                f"SELECT * FROM transactions WHERE account_id = %s AND source = %s"
                f" ORDER BY timestamp {order}, id {order} LIMIT %s",
                (account_id, source, limit),
            )
        else:
            cur.execute(
                f"SELECT * FROM transactions WHERE account_id = %s"
                f" ORDER BY timestamp {order}, id {order} LIMIT %s",
                (account_id, limit),
            )
        return [dict(r) for r in cur.fetchall()]


def count_transactions(account_id: str, source: str | None = None) -> int:
    with _cursor() as cur:
        if source is not None:
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM transactions WHERE account_id = %s AND source = %s",
                (account_id, source),
            )
        else:
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM transactions WHERE account_id = %s",
                (account_id,),
            )
        row = cur.fetchone()
        return row["cnt"] if row else 0


def batch_insert_transactions(rows: list[dict]) -> int:
    if not rows:
        return 0
    with _cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """INSERT INTO transactions
               (account_id, merchant, amount_lkr, bucket_id, bucket_label, source, type, timestamp)
               VALUES %s""",
            [
                (
                    r["account_id"], r["merchant"], r["amount_lkr"],
                    r.get("bucket_id"), r.get("bucket_label"),
                    r.get("source", "mock"), r.get("type", "debit"),
                    r.get("timestamp", datetime.now(timezone.utc).isoformat()),
                )
                for r in rows
            ],
        )
        return cur.rowcount


def clear_demo_transactions(account_id: str) -> int:
    with _cursor() as cur:
        cur.execute(
            "DELETE FROM transactions WHERE account_id = %s AND source = 'mock' RETURNING id",
            (account_id,),
        )
        return len(cur.fetchall())


def reset_demo_state() -> None:
    with _cursor() as cur:
        cur.execute(
            """INSERT INTO demo_state (id, scenario, last_spend) VALUES (1, 'idle', NULL)
               ON CONFLICT (id) DO UPDATE SET scenario = 'idle', last_spend = NULL"""
        )


def reset_demo_full() -> dict:
    with _cursor() as cur:
        cur.execute(
            "DELETE FROM transactions WHERE source IN ('mock', 'transfer') RETURNING id"
        )
        cleared = len(cur.fetchall())

        cur.execute(
            """INSERT INTO allocation_rules (sender_id, account_id, buckets)
               VALUES ('SEY-USR-001', 'SEY-ACC-002', %s)
               ON CONFLICT (sender_id, account_id) DO UPDATE SET buckets = EXCLUDED.buckets""",
            (_j([
                {"id": "school",    "label": "School Fees", "pct": 40},
                {"id": "household", "label": "Household",   "pct": 40},
                {"id": "savings",   "label": "Savings",     "pct": 20},
            ]),),
        )

        cur.execute(
            """INSERT INTO tax_jar_rules
               (user_id, from_account_id, to_account_id, percentage, label, status)
               VALUES ('SEY-BIZ-001', 'SEY-BIZ-001', 'SEY-SAV-001', 10, 'Tax Savings', 'ACTIVE')
               ON CONFLICT (user_id, from_account_id) DO UPDATE
               SET to_account_id = 'SEY-SAV-001', percentage = 10,
                   label = 'Tax Savings', status = 'ACTIVE'"""
        )

        cur.execute(
            "DELETE FROM sessions WHERE user_id IN ('SEY-USR-001', 'SEY-USR-003', 'SEY-BIZ-001')"
        )

        cur.execute(
            """INSERT INTO demo_state (id, scenario, last_spend) VALUES (1, 'idle', NULL)
               ON CONFLICT (id) DO UPDATE SET scenario = 'idle', last_spend = NULL"""
        )

    return {"transactions_cleared": cleared, "buckets": "reset",
            "tax_jar": "reset", "sessions": "cleared"}


def ping() -> bool:
    try:
        with _cursor() as cur:
            cur.execute("SELECT 1")
            return True
    except Exception:
        return False


def save_payment(payment: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    payment.setdefault("created_at", now)
    payment.setdefault("updated_at", now)
    with _cursor() as cur:
        cur.execute(
            """INSERT INTO payments (order_id, status, gateway_response, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            (payment.get("order_id"), payment.get("status"),
             _j(payment.get("gateway_response", {})),
             payment["created_at"], payment["updated_at"]),
        )
        return dict(cur.fetchone() or {})


def update_payment_status(order_id: str, status: str, gateway_response: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    with _cursor() as cur:
        cur.execute(
            """UPDATE payments SET status = %s, gateway_response = %s, updated_at = %s
               WHERE order_id = %s RETURNING *""",
            (status, _j(gateway_response), now, order_id),
        )
        return dict(cur.fetchone() or {})


def get_payment(order_id: str) -> dict | None:
    with _cursor() as cur:
        cur.execute(
            "SELECT * FROM payments WHERE order_id = %s LIMIT 1",
            (order_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None
