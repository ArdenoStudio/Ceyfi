# CEYFI Banking MCP

CEYFI exposes banking operations as **MCP tools** for Cursor, Claude, and the in-app assistant.

## Tools

| Tool | Description |
|------|-------------|
| `get_account_balance` | Savings / current / loan outstanding |
| `get_financial_snapshot` | Health score, anomalies, decisions, forecast |
| `get_recent_transactions` | Last N transactions |
| `get_cfo_brief` | Daily SME CFO briefing |
| `list_receivables` | AR ageing + trust scores |
| `generate_recovery_message` | EN / SI / TA collection copy |
| `predict_payment_dates` | Expected payment dates |

## HTTP (FastAPI)

With the backend running:

```bash
curl http://localhost:8000/api/mcp/tools
curl -X POST http://localhost:8000/api/mcp/call \
  -H 'Content-Type: application/json' \
  -d '{"name":"list_receivables","arguments":{}}'
```

## Stdio (Cursor)

Add to your Cursor MCP config:

```json
{
  "mcpServers": {
    "ceyfi-banking": {
      "command": "python",
      "args": ["C:/Users/suven/Projects/Ceyfi/backend/scripts/banking_mcp_stdio.py"],
      "env": {
        "PYTHONPATH": "C:/Users/suven/Projects/Ceyfi/backend"
      }
    }
  }
}
```

Adjust paths for your machine. The stdio server uses the same tool implementations as the HTTP bridge (fixtures + optional live Seylan when configured).

## Seylan live data

Set on the backend:

```env
USE_SEYLAN_REAL=true
SEYLAN_API_KEY=your-sandbox-key
```

Account inquiry enriches snapshots when enabled.
