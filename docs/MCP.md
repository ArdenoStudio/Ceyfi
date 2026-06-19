# CEYFI Banking MCP v2

CEYFI exposes banking operations as a **full MCP server** — tools, resources, and prompts — for Cursor, Claude Desktop, and the in-app assistant.

**Protocol:** `ceyfi-banking-mcp-v2` · **25 tools** · **6 resources** · **6 prompts**

## Why CEYFI MCP (vs generic open-banking MCPs)

| Capability | Plaid / bank-mcp / zavora | CEYFI MCP |
|------------|---------------------------|-----------|
| Account balances & transactions | ✅ | ✅ |
| Spending summary & search | ✅ | ✅ |
| Liabilities & debt payoff | ✅ (plaid-mcp) | ✅ `summarize_debt` |
| Institution linking (12k+ banks) | ✅ | ❌ (Seylan sandbox when enabled) |
| **Persona-aware twin** (diaspora / borrower / SME) | ❌ | ✅ |
| **Ranked decisions + execute** | ❌ | ✅ |
| **CFO brief & cash runway** | ❌ | ✅ |
| **AR trust scores & recovery (EN/SI/TA)** | ❌ | ✅ |
| **Family wallet & remittance FX** | ❌ | ✅ |
| **Anomaly detection** | partial | ✅ |
| **Trilingual prompts** | ❌ | ✅ |

CEYFI does not replace Plaid for US/EU aggregation — it **composes** open-banking patterns with Sri Lanka–specific intelligence (Seylan, LKR, Sinhala/Tamil, SME receivables).

### Inspiration sources (research)

- [zavora-ai/mcp-banking](https://github.com/zavora-ai/mcp-banking) — 15 tools, Plaid/Mono/Open Banking
- [elcukro/bank-mcp](https://github.com/elcukro/bank-mcp) — read-only Plaid/Teller/Tink
- [t-rhex/plaid-mcp](https://github.com/t-rhex/plaid-mcp) — liabilities, debt analysis, investments
- [Prometeo MCP fintech guide](https://prometeoapi.com/en/blog/model-context-protocol-fintech) — enterprise patterns

## Tools (by category)

### Identity & accounts
| Tool | Risk | Description |
|------|------|-------------|
| `list_personas` | read_only | Demo users (diaspora, borrower, SME) |
| `list_accounts` | read_only | Linked accounts and balances |
| `get_account_balance` | read_only | Savings / current / loan outstanding |

### Transactions
| Tool | Risk | Description |
|------|------|-------------|
| `get_recent_transactions` | read_only | Last N transactions |
| `search_transactions` | read_only | Filter by keyword / amount |
| `get_spending_summary` | read_only | Income vs spend, top merchants |
| `categorize_transactions` | read_only | SME tax-ready categories |

### Remittance (CEYFI)
| Tool | Risk | Description |
|------|------|-------------|
| `get_family_wallet` | read_only | Bucket allocations & remittance |
| `get_fx_rate` | read_only | GBP/USD/EUR → LKR |

### Liabilities
| Tool | Risk | Description |
|------|------|-------------|
| `check_loan_status` | read_only | Health score & EMI schedule |
| `get_liabilities` | read_only | All loans with due dates |
| `summarize_debt` | read_only | Avalanche / snowball payoff |
| `pay_loan_instalment` | **financial_action** | Card checkout for EMI |

### Intelligence twin
| Tool | Risk | Description |
|------|------|-------------|
| `get_financial_snapshot` | read_only | Health, anomalies, decisions, forecast |
| `list_decisions` | read_only | Ranked actions with benefit LKR |
| `execute_decision` | **financial_action** | Run recovery / redirect action |
| `list_anomalies` | read_only | Flagged unusual transactions |
| `get_health_breakdown` | read_only | Five-pillar score components |
| `simulate_cash_scenario` | read_only | What-if cash projection |

### SME / FlowPilot
| Tool | Risk | Description |
|------|------|-------------|
| `get_cfo_brief` | read_only | Daily CFO briefing |
| `list_receivables` | read_only | AR ageing + trust scores |
| `generate_recovery_message` | read_only | EN / SI / TA collection copy |
| `predict_payment_dates` | read_only | Expected payment dates |
| `get_pl_summary` | read_only | Weekly P&L |
| `get_cash_runway` | read_only | Runway days at current burn |

## Resources

| URI | Content |
|-----|---------|
| `ceyfi://catalog/personas` | Demo persona registry |
| `ceyfi://catalog/tools` | Full tool catalog with risk tiers |
| `ceyfi://business/receivables` | AR ledger + trust scores |
| `ceyfi://fx/rates` | Corridor FX rates |
| `ceyfi://user/{user_id}/context` | Balances + recent activity |
| `ceyfi://wallet/{wallet_id}` | Family wallet buckets |

## Prompts

| Prompt | Use case |
|--------|----------|
| `cfo-morning-brief` | SME morning briefing from live data |
| `recovery-collection` | Trilingual overdue invoice messages |
| `loan-health-review` | Borrower loan analysis |
| `diaspora-remittance-timing` | FX + wallet timing advice |
| `anomaly-fraud-review` | Review flagged anomalies |
| `debt-payoff-plan` | Avalanche vs snowball comparison |

## HTTP (FastAPI)

```bash
curl http://localhost:8000/api/mcp
curl http://localhost:8000/api/mcp/tools
curl http://localhost:8000/api/mcp/resources
curl http://localhost:8000/api/mcp/resources/ceyfi/catalog/personas
curl http://localhost:8000/api/mcp/prompts
curl -X POST http://localhost:8000/api/mcp/prompts/get \
  -H 'Content-Type: application/json' \
  -d '{"name":"cfo-morning-brief","arguments":{"user_id":"SEY-BIZ-001"}}'
curl -X POST http://localhost:8000/api/mcp/call \
  -H 'Content-Type: application/json' \
  -d '{"name":"list_personas","arguments":{}}'
```

## Stdio (Cursor) — recommended

Add to Cursor MCP settings (`mcp.json`):

```json
{
  "mcpServers": {
    "ceyfi-banking": {
      "command": "python",
      "args": ["backend/scripts/banking_mcp_stdio.py"],
      "cwd": "C:/Users/suven/Projects/Ceyfi",
      "env": {
        "PYTHONPATH": "backend"
      }
    }
  }
}
```

Uses the official Python `mcp` SDK (FastMCP) with stdio transport.

## Seylan live data

When the backend has Seylan sandbox enabled:

```env
USE_SEYLAN_REAL=true
SEYLAN_API_KEY=your-sandbox-key
```

`get_financial_snapshot` and balance tools enrich from live account inquiry when available.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Cursor /    │────▶│ banking_mcp_     │────▶│ app/mcp/        │
│ Claude MCP  │     │ stdio.py         │     │ handlers.py     │
└─────────────┘     └──────────────────┘     └────────┬────────┘
┌─────────────┐     ┌──────────────────┐              │
│ In-app chat │────▶│ /api/mcp/call    │──────────────┤
└─────────────┘     └──────────────────┘              ▼
                                              fixtures + Seylan + Groq
```

Single registry: `app/mcp/registry.py` · Shared handlers: `app/mcp/handlers.py`

## Security notes

- Demo mode uses fixture data; no real PII leaves the server in mock mode.
- `financial_action` tools (`pay_loan_instalment`, `execute_decision`) should be gated by auth in production.
- For enterprise: add OAuth 2.0, MCP gateway, and audit logging (see MintMCP / Prometeo patterns).
