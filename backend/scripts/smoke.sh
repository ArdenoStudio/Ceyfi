#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:8000}"
GREEN="\033[0;32m"; RED="\033[0;31m"; RESET="\033[0m"

pass() { echo -e "${GREEN}PASS${RESET} $1"; }
fail() { echo -e "${RED}FAIL${RESET} $1"; exit 1; }

check() {
  local label="$1"; local url="$2"; local expected="$3"
  local out; out=$(curl -sf "$url" 2>/dev/null) || fail "$label (curl failed)"
  echo "$out" | grep -q "$expected" && pass "$label" || fail "$label (expected '$expected' in: $out)"
}

check_post() {
  local label="$1"; local url="$2"; local body="$3"; local expected="$4"
  local out; out=$(curl -sf -X POST -H "Content-Type: application/json" -d "$body" "$url" 2>/dev/null) || fail "$label (curl failed)"
  echo "$out" | grep -q "$expected" && pass "$label" || fail "$label (expected '$expected' in: $out)"
}

echo "=== Seylan Hub smoke tests against $BASE ==="
check       "/health"                              "$BASE/health"                                             "ok"
check       "/mock/account-context/SEY-USR-001"    "$BASE/mock/account-context/SEY-USR-001"                  "Nimal"
check       "/mock/family-wallet/SEY-ACC-002"      "$BASE/mock/family-wallet/SEY-ACC-002"                    "Kumari"
check       "/mock/loans/SEY-USR-001"              "$BASE/mock/loans/SEY-USR-001"                            "ON_TRACK"
check       "/mock/loans/SEY-USR-003"              "$BASE/mock/loans/SEY-USR-003"                            "AT_RISK"
check       "/mock/business-account/SEY-BIZ-001"   "$BASE/mock/business-account/SEY-BIZ-001"                 "Silva"
check       "/mock/pl-summary/SEY-BIZ-001"         "$BASE/mock/pl-summary/SEY-BIZ-001"                       "47200"
check_post  "/mock/trigger-spend"   "$BASE/mock/trigger-spend" \
  '{"account_id":"SEY-ACC-002","merchant":"Test","amount_lkr":500,"bucket_id":"household"}' "POSTED"
check_post  "/mock/tax-jar/trigger" "$BASE/mock/tax-jar/trigger" \
  '{"user_id":"SEY-BIZ-001","incoming_amount_lkr":8200,"description":"Test"}' "COMPLETED"
check_post  "/api/wallet/transfer"  "$BASE/api/wallet/transfer" \
  '{"sender_account_id":"SEY-USR-001","recipient_account_id":"SEY-ACC-002","amount_lkr":10000,"corridor":"GBPLKR","allocation_rules":[{"bucket_id":"school","pct":40},{"bucket_id":"household","pct":40},{"bucket_id":"savings","pct":20}]}' "COMPLETED"
check_post  "/api/tax-jar/rule"     "$BASE/api/tax-jar/rule" \
  '{"user_id":"SEY-BIZ-001","from_account_id":"SEY-BIZ-001","to_account_id":"SEY-SAV-001","percentage":10}' "ACTIVE"
check_post  "/api/categorize-transactions" "$BASE/api/categorize-transactions" \
  '{"user_id":"SEY-BIZ-001","transaction_ids":["biz_039","biz_040"]}' "INCOME"
check       "/api/loans/SEY-USR-001/health"        "$BASE/api/loans/SEY-USR-001/health"                      "ON_TRACK"

echo -e "\n${GREEN}All smoke tests passed!${RESET}"