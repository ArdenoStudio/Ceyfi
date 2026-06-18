# Seylan Hub — integration brief for Seylan Bank

**Audience:** Seylan Transaction Banking / Digital Banking / Partner technical contacts  
**Purpose:** Align Seylan Hub (demo + production roadmap) with bank-provisioned APIs, environments, and compliance—mirroring integrations such as Open API Banking and JustPay / LankaPay as described publicly (e.g. eChannelling partnership press release on [seylan.lk](https://www.seylan.lk)).

## Summary for Seylan stakeholders

Seylan Hub is a customer experience layer (Next.js frontend + FastAPI backend) built to showcase AI-assisted diaspora wallets, SME bookkeeping, loan clarity, and voice assistance. It is **not** a replacement for retail Internet Banking or the mobile app. Where programmatic settlement or account inquiry is needed, Hub expects to call Seylan’s **partner API gateway** with credentials you provision—same technical family as Corporate/SME open integration narratives.

Today the codebase targets a **development gateway** and keeps real calls behind feature flags until you confirm production equivalents and security posture.

### What we are asking Seylan to confirm

1. **Environments**
   - Authoritative base URLs for **sandbox / UAT / production** for:
     - Default gateway (account inquiry, internal transfer, Merchant QR payloads as currently modeled).
     - Any separate host/port for QR or Lanka QR flows (`seylan_gateway_qr` in our config today points at a distinct port).
   - Whether TLS verification should use Seylan-supplied roots or standard public chains (current dev client disables verify for sandbox convenience only—we will enforce proper verification for production).

2. **Authentication and authorization**
   - Confirm mechanism: HTTP header **`api_key`**, OAuth2, mutual TLS, or other.
   - Key rotation cadence and who receives alerts on expiry.
   - IP allowlisting or VPN requirement for gateway access.

3. **Merchant / QR (payment collection into Seylan-led acceptance)**
   - Test **MID/TID**, channel user ID and password, **checksum key** (`seylan_checksum_key_merchant`), and **`Institution_id`** semantics.
   - Staging SLA for onboarding (merchant portal aligns with fast enablement narratives on [merchant portal overview](https://www.seylan.lk/digital-banking/merchant-portal)).

4. **Transfers and mandates (JustPay vs internal vs CEFTS)**
   - For diaspora corridors and SME payouts Hub may need:
     - **Internal transfers** between Seylan accounts, and/or
     - **CEFTS** initiation for other-bank rails, and/or
     - **JustPay** account debits aligned with mandates (our `justpay.py` stubs await your lifecycle spec).
   - Which rails are permitted for Hub’s pilot customer segment?
   - OTP, mandate, consent, and cooling-off policies we must bake into UX.

5. **Read path: balances and transactions**
   - Confirmation that account inquiry endpoints used in our **`account.py`** module are approved for Hub’s tenant when `USE_SEYLAN_REAL=true`.
   - Allowed account categories (e.g. `EXT`), rate limits, and PII masking rules for feeding the AI assistant safely.

### Out of scope unless you explicitly authorize

- Screen-scraping or reverse-engineering [retail Internet Banking](https://www.seylan.lk/digital-banking/internet-banking) or the mobile banking app.
- Acting as a payment aggregator without PSP / partnership agreements.

---

**Suggested reply format:** Reply with environment matrix (URL + purpose), auth appendix, MID/TID for test merchants, and a one-page mandate/transfer matrix (internal / CEFT / JustPay) for the pilot persona set.
