from app.config import settings
from app.seylan import mpgs


def test_checkout_url_includes_rest_version(monkeypatch):
    monkeypatch.setattr(settings, "frontend_base_url", "https://example.test/")
    monkeypatch.setattr(settings, "mpgs_merchant_id", "CURSOR1")
    monkeypatch.setattr(settings, "mpgs_api_version", "79")

    url = mpgs._checkout_url("SESSION/123")

    assert url == (
        "https://example.test/payments/checkout"
        "?session=SESSION%2F123&merchant=CURSOR1&version=79"
    )


def test_format_amount_uses_two_decimals():
    assert mpgs._format_amount(150) == "150.00"
    assert mpgs._format_amount(150.5) == "150.50"
