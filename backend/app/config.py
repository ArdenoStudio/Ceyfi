from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Seylan gateway (sandbox proxy — override via env for production)
    seylan_gateway_default: str = "http://34.21.206.87:3000"
    seylan_gateway_qr: str = "https://dev.apigateway1.seylan.lk:2250"
    seylan_api_key: str = ""
    seylan_checksum_key_merchant: str = ""
    seylan_checksum_key_lankaqr: str = ""
    seylan_justpay_code: str = "6289_M001_001"

    # Merchant QR (bank-provisioned)
    seylan_merchant_institution_id: str = "1"
    seylan_merchant_channel_user_id: str = ""
    seylan_merchant_channel_pass: str = ""
    seylan_merchant_login_id: str = ""
    seylan_merchant_login_pass: str = ""
    seylan_merchant_mid: str = ""
    seylan_merchant_tid: str = ""

    # Feature flags
    use_seylan_real: bool = False
    seylan_enable_transfers: bool = False
    seylan_enable_merchant_qr: bool = False

    # Hackathon sandbox internal-transfer test accounts (override via env)
    seylan_sandbox_source_account: str = "064000012548001"
    seylan_sandbox_destination_account: str = "001213437904100"

    # MPGS (Mastercard Payment Gateway Services) — Hosted Checkout
    mpgs_host: str = "test-seylan.mtf.gateway.mastercard.com"
    mpgs_merchant_id: str = ""  # e.g. CURSOR1
    mpgs_api_password: str = ""
    # Leave empty when using merchant-level Integration Authentication passwords.
    # Operator-scoped usernames (merchant.<mid>.operator.<op>) require matching credentials.
    mpgs_operator_id: str = ""
    # Hosted Checkout's browser script and REST session version must match.
    mpgs_api_version: str = "79"
    mpgs_enable: bool = False

    # PayHere — Hosted Checkout (sandbox)
    payhere_merchant_id: str = ""
    payhere_secret: str = ""
    # Reject PayHere webhooks with missing or invalid md5sig when credentials are configured
    payhere_strict_notify_hash: bool = True

    # Request limits
    max_request_body_bytes: int = 1_048_576  # 1 MiB
    max_stt_upload_bytes: int = 5_242_880  # 5 MiB

    # AI
    openai_api_key: str = ""
    groq_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"

    # Database (Neon PostgreSQL)
    database_url: str = ""

    # Supabase (legacy — unused, kept for env compat)
    supabase_url: str = ""
    supabase_service_key: str = ""

    # App
    cors_origins: str = (
        "http://localhost:3000,"
        "http://localhost:3003,"
        "http://localhost:3005,"
        "https://frontend-taupe-three-96.vercel.app,"
        "https://ceyfi.app"
    )
    frontend_base_url: str = "https://frontend-taupe-three-96.vercel.app"
    backend_base_url: str = "http://localhost:8000"

    # Demo auth & admin (set via env — no insecure defaults)
    demo_session_secret: str = ""
    demo_session_ttl_seconds: int = 86400 * 7
    demo_admin_key: str = ""
    demo_auth_required: bool = True

    # MPGS webhook: verify CAPTURED status with gateway API before fulfillment
    mpgs_webhook_verify: bool = True

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
