#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:8000}"
GREEN="\033[0;32m"; RED="\033[0;31m"; RESET="\033[0m"

pass() { echo -e "${GREEN}PASS${RESET} $1"; }
fail() { echo -e "${RED}FAIL${RESET} $1"; exit 1; }

fetch_token() {
  local user_id="$1"
  curl -sf -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"$user_id\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"
}

check() {
  local label="$1"; local url="$2"; local expected="$3"; local token="${4:-}"
  local -a curl_args=(-sf)
  if [ -n "$token" ]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi
  local out; out=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || fail "$label (curl failed)"
  echo "$out" | grep -q "$expected" && pass "$label" || fail "$label (expected '$expected' in: $out)"
}

check_post() {
  local label="$1"; local url="$2"; local body="$3"; local expected="$4"; local token="${5:-}"
  local -a curl_args=(-sf -X POST -H "Content-Type: application/json" -d "$body")
  if [ -n "$token" ]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi
  local out; out=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || fail "$label (curl failed)"
  echo "$out" | grep -q "$expected" && pass "$label" || fail "$label (expected '$expected' in: $out)"
}

echo "=== CEYFI backend smoke tests against $BASE ==="
check "/health" "$BASE/health" "ok"

# Detect whether demo auth is enforced (401 without a session).
AUTH_REQUIRED=false
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/mock/account-context/SEY-USR-001" || true)
if [ "$status" = "401" ]; then
  AUTH_REQUIRED=true
fi

TOKEN_DIASPORA=""
TOKEN_BORROWER=""
TOKEN_SME=""
if [ "$AUTH_REQUIRED" = true ]; then
  TOKEN_DIASPORA=$(fetch_token "SEY-USR-001") || fail "login SEY-USR-001 (diaspora)"
  TOKEN_BORROWER=$(fetch_token "SEY-USR-003") || fail "login SEY-USR-003 (borrower)"
  TOKEN_SME=$(fetch_token "SEY-BIZ-001") || fail "login SEY-BIZ-001 (sme)"
  pass "/api/auth/login (all personas)"
fi

check       "/mock/account-context/SEY-USR-001"    "$BASE/mock/account-context/SEY-USR-001"                  "Nimal"     "$TOKEN_DIASPORA"
check       "/mock/family-wallet/SEY-ACC-002"      "$BASE/mock/family-wallet/SEY-ACC-002"                    "Kumari"    "$TOKEN_DIASPORA"
check       "/mock/loans/SEY-USR-001"              "$BASE/mock/loans/SEY-USR-001"                            "ON_TRACK"  "$TOKEN_DIASPORA"
check       "/mock/loans/SEY-USR-003"              "$BASE/mock/loans/SEY-USR-003"                            "AT_RISK"   "$TOKEN_BORROWER"
check       "/mock/business-account/SEY-BIZ-001"   "$BASE/mock/business-account/SEY-BIZ-001"                 "Silva"     "$TOKEN_SME"
check       "/mock/pl-summary/SEY-BIZ-001"         "$BASE/mock/pl-summary/SEY-BIZ-001"                       "47200"     "$TOKEN_SME"
check_post  "/mock/trigger-spend"   "$BASE/mock/trigger-spend" \
  '{"account_id":"SEY-ACC-002","merchant":"Test","amount_lkr":500,"bucket_id":"household"}' "POSTED" "$TOKEN_DIASPORA"
check_post  "/mock/tax-jar/trigger" "$BASE/mock/tax-jar/trigger" \
  '{"user_id":"SEY-BIZ-001","incoming_amount_lkr":8200,"description":"Test"}' "COMPLETED" "$TOKEN_SME"
check_post  "/api/wallet/transfer"  "$BASE/api/wallet/transfer" \
  '{"sender_account_id":"SEY-USR-001","recipient_account_id":"SEY-ACC-002","amount_lkr":10000,"corridor":"GBPLKR","allocation_rules":[{"bucket_id":"school","pct":40},{"bucket_id":"household","pct":40},{"bucket_id":"savings","pct":20}]}' "COMPLETED" "$TOKEN_DIASPORA"
check_post  "/api/tax-jar/rule"     "$BASE/api/tax-jar/rule" \
  '{"user_id":"SEY-BIZ-001","from_account_id":"SEY-BIZ-001","to_account_id":"SEY-SAV-001","percentage":10}' "ACTIVE" "$TOKEN_SME"
check_post  "/api/categorize-transactions" "$BASE/api/categorize-transactions" \
  '{"user_id":"SEY-BIZ-001","transaction_ids":["biz_039","biz_040"]}' "INCOME" "$TOKEN_SME"
check       "/api/loans/SEY-USR-001/health"        "$BASE/api/loans/SEY-USR-001/health"                      "ON_TRACK"  "$TOKEN_DIASPORA"
check       "/api/market/overview"                 "$BASE/api/market/overview"                              "COMB"      "$TOKEN_DIASPORA"
check       "/api/market/fires/f-1"                "$BASE/api/market/fires/f-1"                             "still_true" "$TOKEN_DIASPORA"
check       "/api/market/symbols/COMB.N0000/bars"  "$BASE/api/market/symbols/COMB.N0000/bars"               "candle_ok" "$TOKEN_DIASPORA"
check       "/api/market/symbols/CARS.N0000/disclosures" "$BASE/api/market/symbols/CARS.N0000/disclosures" "brief"     "$TOKEN_DIASPORA"

echo -e "\n${GREEN}All smoke tests passed!${RESET}"
