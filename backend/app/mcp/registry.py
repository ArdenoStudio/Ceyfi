"""CEYFI MCP catalog — single source of truth for tools, resources, and prompts."""

from __future__ import annotations

from typing import Any

# Risk tiers mirror open-banking MCP conventions (read_only | financial_action | write)
RiskTier = str

TOOL_CATALOG: list[dict[str, Any]] = [
    # --- Identity & accounts (parity: bank-mcp, plaid-mcp) ---
    {
        "name": "list_personas",
        "description": "List demo CEYFI personas (diaspora, borrower, SME) with user IDs.",
        "risk": "read_only",
        "category": "identity",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "list_accounts",
        "description": "List linked accounts and balances for a user (savings, current, wallet buckets).",
        "risk": "read_only",
        "category": "accounts",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "get_account_balance",
        "description": "Get savings, current, or loan outstanding balance.",
        "risk": "read_only",
        "category": "accounts",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "account_type": {
                    "type": "string",
                    "enum": ["savings", "current", "loan_outstanding"],
                },
            },
            "required": ["user_id", "account_type"],
        },
    },
    # --- Transactions (parity: zavora mcp-banking, plaid-mcp) ---
    {
        "name": "get_recent_transactions",
        "description": "Recent transactions for a user account.",
        "risk": "read_only",
        "category": "transactions",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "count": {"type": "integer", "default": 5},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "search_transactions",
        "description": "Search transactions by keyword, date range, or min/max amount.",
        "risk": "read_only",
        "category": "transactions",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "query": {"type": "string", "description": "Merchant or description substring"},
                "min_amount_lkr": {"type": "number"},
                "max_amount_lkr": {"type": "number"},
                "limit": {"type": "integer", "default": 20},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_spending_summary",
        "description": "Income vs spend breakdown with top merchants (Plaid spending_summary equivalent).",
        "risk": "read_only",
        "category": "transactions",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "days": {"type": "integer", "default": 30},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "categorize_transactions",
        "description": "AI + heuristic categorization for SME transactions (tax-ready buckets).",
        "risk": "read_only",
        "category": "transactions",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "default": "SEY-BIZ-001"},
                "limit": {"type": "integer", "default": 15},
            },
        },
    },
    # --- Diaspora / FX (CEYFI-specific) ---
    {
        "name": "get_family_wallet",
        "description": "Family wallet buckets, remittance history, and recipient spend.",
        "risk": "read_only",
        "category": "remittance",
        "parameters": {
            "type": "object",
            "properties": {"wallet_account_id": {"type": "string", "default": "SEY-ACC-002"}},
        },
    },
    {
        "name": "get_fx_rate",
        "description": "Corridor FX rate for diaspora remittance timing (GBP/USD/EUR → LKR).",
        "risk": "read_only",
        "category": "remittance",
        "parameters": {
            "type": "object",
            "properties": {
                "from_currency": {"type": "string", "default": "GBP"},
                "to_currency": {"type": "string", "default": "LKR"},
            },
        },
    },
    # --- Liabilities & loans (parity: plaid-mcp get_liabilities, summarize_debt) ---
    {
        "name": "check_loan_status",
        "description": "Loan health score, EMI schedule, and outstanding balance.",
        "risk": "read_only",
        "category": "liabilities",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "get_liabilities",
        "description": "All liabilities: loans, EMIs, due dates, and APR-style rates.",
        "risk": "read_only",
        "category": "liabilities",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "summarize_debt",
        "description": "Debt payoff projection (avalanche vs snowball) for active loans.",
        "risk": "read_only",
        "category": "liabilities",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "strategy": {"type": "string", "enum": ["avalanche", "snowball"], "default": "avalanche"},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "pay_loan_instalment",
        "description": "Create a card checkout session for the next loan instalment.",
        "risk": "financial_action",
        "category": "payments",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "default": "SEY-USR-003"},
                "amount_lkr": {"type": "number"},
            },
        },
    },
    # --- Intelligence twin (CEYFI core) ---
    {
        "name": "get_financial_snapshot",
        "description": "Unified health score, anomalies, decisions, and 30-day forecast.",
        "risk": "read_only",
        "category": "intelligence",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "persona": {"type": "string", "enum": ["diaspora", "borrower", "sme"]},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "list_decisions",
        "description": "Ranked actionable decisions with benefit LKR and confidence.",
        "risk": "read_only",
        "category": "intelligence",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "persona": {"type": "string", "enum": ["diaspora", "borrower", "sme"]},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "execute_decision",
        "description": "Execute a ranked decision (recovery message, redirect action, etc.).",
        "risk": "financial_action",
        "category": "intelligence",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "decision_id": {"type": "string"},
            },
            "required": ["user_id", "decision_id"],
        },
    },
    {
        "name": "list_anomalies",
        "description": "Flagged unusual transactions from the financial twin.",
        "risk": "read_only",
        "category": "intelligence",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "get_health_breakdown",
        "description": "Five-pillar health score components with insights and actions.",
        "risk": "read_only",
        "category": "intelligence",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "persona": {"type": "string", "enum": ["diaspora", "borrower", "sme"]},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "simulate_cash_scenario",
        "description": "What-if cash balance after income, spend, or EMI shock.",
        "risk": "read_only",
        "category": "intelligence",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "income_delta_lkr": {"type": "number", "default": 0},
                "expense_delta_lkr": {"type": "number", "default": 0},
                "days": {"type": "integer", "default": 30},
            },
            "required": ["user_id"],
        },
    },
    # --- SME / FlowPilot (CEYFI differentiator) ---
    {
        "name": "get_cfo_brief",
        "description": "Daily SME CFO briefing with prioritized actions.",
        "risk": "read_only",
        "category": "sme",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "list_receivables",
        "description": "Outstanding receivables with trust scores.",
        "risk": "read_only",
        "category": "sme",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "generate_recovery_message",
        "description": "AI collection messages in English, Sinhala, and Tamil.",
        "risk": "read_only",
        "category": "sme",
        "parameters": {
            "type": "object",
            "properties": {
                "client": {"type": "string"},
                "invoice": {"type": "string"},
                "amount": {"type": "number"},
                "overdue_days": {"type": "integer"},
                "tone": {"type": "string", "enum": ["friendly", "formal", "urgent"]},
            },
            "required": ["client", "invoice", "amount", "overdue_days"],
        },
    },
    {
        "name": "predict_payment_dates",
        "description": "Forecast when overdue invoices will be paid.",
        "risk": "read_only",
        "category": "sme",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "get_pl_summary",
        "description": "Weekly P&L summary for SME (revenue, expenses, margin).",
        "risk": "read_only",
        "category": "sme",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string", "default": "SEY-BIZ-001"}},
        },
    },
    {
        "name": "get_cash_runway",
        "description": "SME cash runway in days at current burn.",
        "risk": "read_only",
        "category": "sme",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string", "default": "SEY-BIZ-001"}},
        },
    },
]

RESOURCE_CATALOG: list[dict[str, Any]] = [
    {
        "uri": "ceyfi://catalog/personas",
        "name": "Demo personas",
        "description": "CEYFI demo users and persona types",
        "mimeType": "application/json",
    },
    {
        "uri": "ceyfi://catalog/tools",
        "name": "Tool catalog",
        "description": "Full MCP tool list with risk tiers",
        "mimeType": "application/json",
    },
    {
        "uri": "ceyfi://business/receivables",
        "name": "Receivables ledger",
        "description": "AR ageing with trust scores",
        "mimeType": "application/json",
    },
    {
        "uri": "ceyfi://fx/rates",
        "name": "FX corridor rates",
        "description": "Demo remittance FX rates into LKR",
        "mimeType": "application/json",
    },
    {
        "uri": "ceyfi://user/{user_id}/context",
        "name": "User account context",
        "description": "Balances, accounts, and recent activity",
        "mimeType": "application/json",
    },
    {
        "uri": "ceyfi://wallet/{wallet_id}",
        "name": "Family wallet",
        "description": "Bucket allocations and remittance history",
        "mimeType": "application/json",
    },
]

PROMPT_CATALOG: list[dict[str, Any]] = [
    {
        "name": "cfo-morning-brief",
        "description": "Generate an SME CFO morning briefing from live CEYFI data",
        "arguments": [
            {"name": "user_id", "description": "SME user ID", "required": True},
        ],
    },
    {
        "name": "recovery-collection",
        "description": "Draft trilingual payment recovery messages for an overdue invoice",
        "arguments": [
            {"name": "client", "required": True},
            {"name": "invoice", "required": True},
            {"name": "amount", "required": True},
            {"name": "overdue_days", "required": True},
            {"name": "tone", "required": False},
        ],
    },
    {
        "name": "loan-health-review",
        "description": "Analyze loan health and recommend next steps for a borrower",
        "arguments": [{"name": "user_id", "required": True}],
    },
    {
        "name": "diaspora-remittance-timing",
        "description": "Advise on remittance timing using FX and family wallet context",
        "arguments": [{"name": "user_id", "required": False}],
    },
    {
        "name": "anomaly-fraud-review",
        "description": "Review flagged anomalies and suggest protective actions",
        "arguments": [{"name": "user_id", "required": True}],
    },
    {
        "name": "debt-payoff-plan",
        "description": "Compare avalanche vs snowball payoff strategies",
        "arguments": [
            {"name": "user_id", "required": True},
            {"name": "strategy", "required": False},
        ],
    },
]
