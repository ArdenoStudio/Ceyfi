# Seylan Hub ↔ Seylan API gateway — module and environment map

This document ties **persona surfaces in Seylan Hub** to **backend routers** and **Python modules** under [`backend/app/seylan`](../../backend/app/seylan/), plus **environment variables** from [`backend/app/config.py`](../../backend/app/config.py).

Pydantic BaseSettings reads these from environment; names are **`UPPER_SNAKE_CASE`** equivalents of field names below (see `backend/app/config.py`).

## Feature flags (global behaviour)

| Variable | Default | Effect |
|---------|---------|--------|
| `USE_SEYLAN_REAL` | `false` | When `true`, eligible code paths attempt live Seylan gateway calls instead of mocks-only behaviour. |
| `SEYLAN_ENABLE_TRANSFERS` | `false` | Enables `transfer_funds` from [`wallet.py`](../../backend/app/routers/wallet.py) POST `/api/wallet/transfer`. |
| `SEYLAN_ENABLE_MERCHANT_QR` | `false` | Reserved for routers that expose QR generation (wired from [`qr.py`](../../backend/app/seylan/qr.py) once routes are enabled). |

**Note:** Effective internal transfer additionally requires **`USE_SEYLAN_REAL=true`** in the wallet route.

## Gateway and credentials

| Variable | Typical use |
|----------|-------------|
| `SEYLAN_GATEWAY_DEFAULT` | Default host for inquiries, postings, Merchant QR (`ServiceGroup.DEFAULT` in [`client.py`](../../backend/app/seylan/client.py)). |
| `SEYLAN_GATEWAY_QR` | Alternate base used when client uses `ServiceGroup.QR`. |
| `SEYLAN_API_KEY` | Sent as HTTP header `api_key` on every gateway request (see [`client.py`](../../backend/app/seylan/client.py)). |

### Merchant QR (`qr.py`)

| Variable | Purpose |
|----------|---------|
| `SEYLAN_MERCHANT_INSTITUTION_ID` | Institution identifier in gateway payload |
| `SEYLAN_MERCHANT_CHANNEL_USER_ID` / `SEYLAN_MERCHANT_CHANNEL_PASS` | Channel credentials |
| `SEYLAN_MERCHANT_LOGIN_ID` / `SEYLAN_MERCHANT_LOGIN_PASS` | Merchant portal–style login in API body |
| `SEYLAN_MERCHANT_MID` / `SEYLAN_MERCHANT_TID` | Terminal identity for QR generation |
| `SEYLAN_CHECKSUM_KEY_MERCHANT` | Symmetric key for request checksum |

### Lanka QR (future)

| Variable | Purpose |
|----------|---------|
| `SEYLAN_CHECKSUM_KEY_LANKAQR` | For LankaQR flows stubbed in [`qr.py`](../../backend/app/seylan/qr.py). |

### JustPay (`justpay.py`)

| Variable | Purpose |
|----------|---------|
| `SEYLAN_JUSTPAY_CODE` | Placeholder merchant/JustPay routing code configured for future mandate and debit flows |

All functions in [`justpay.py`](../../backend/app/seylan/justpay.py) currently raise **`NotConfiguredError`** until Seylan provisions the mandate and debit API specification.

---

## Hub products → Seylan integration surface

| Hub module | Frontend route | Backend router / entry | Seylan Python module(s) | When live |
|-----------|----------------|------------------------|--------------------------|-----------|
| Diaspora wallet (send & allocate) | `/wallet` | [`wallet.py`](../../backend/app/routers/wallet.py) POST `/api/wallet/transfer` | [`transfers.py`](../../backend/app/seylan/transfers.py) `transfer_funds` | `USE_SEYLAN_REAL` + `SEYLAN_ENABLE_TRANSFERS` |
| AI assistant — balance context | `/assistant` | [`chat.py`](../../backend/app/routers/chat.py) POST `/api/chat` | [`account.py`](../../backend/app/seylan/account.py) `get_balance` | `USE_SEYLAN_REAL` (enriches system prompt context; failures fall back to fixtures) |
| SME bookkeeper / demos | `/business`, `/demo` | [`mock.py`](../../backend/app/routers/mock.py) for demo inserts | Merchant QR fits **payments into** an account—use [`qr.py`](../../backend/app/seylan/qr.py) once an API route binds to it | After QR route + merchant credentials (`SEYLAN_ENABLE_MERCHANT_QR`) |
| Loan dashboard | `/loans` | [`loans.py`](../../backend/app/routers/loans.py) | No Seylan gateway binding in repo yet; repayment execution remains a **customer handoff** to official channels |

### Transfers submodule (`transfers.py`)

| Function | Approximate gateway responsibility |
|----------|------------------------------------|
| `transfer_funds` | Internal Seylan account-to-account posting (`InternalTransfer`) |
| `initiate_cefts` | External other-bank initiation (`InitiateCEFTSTransfer`) |

### Inquiry submodule (`account.py`)

| Function | Approximate gateway responsibility |
|----------|-------------------------------------|
| `get_balance` | Account balance inquiry |
| `get_transactions` / `get_recent_transactions` / `iter_transactions_range` | Transaction history inquiry |

---

## UX handoff vs API

Retail features that customers complete in **official Seylan Internet Banking or Mobile Banking** remain **out-of-band links** unless Seylan exposes partner read/write APIs approved for Hub. The frontend **`SeylanBankHandoffBanner`** documents those canonical URLs beside demo screens.
