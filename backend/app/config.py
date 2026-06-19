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

    # AI
    groq_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"

    # Database (Neon PostgreSQL)
    database_url: str = ""

    # App
    cors_origins: str = (
        "http://localhost:3000,"
        "https://seylan-hub.vercel.app,"
        "https://seylan-hub1.vercel.app,"
        "https://seylan-hub-frontend.netlify.app"
    )
    frontend_base_url: str = "https://seylan-hub-frontend.netlify.app"

    # Demo auth & admin
    demo_session_secret: str = "ceyfi-demo-session-change-in-production"
    demo_session_ttl_seconds: int = 86400 * 7
    demo_admin_key: str = "ceyfi-demo-admin"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
