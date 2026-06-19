"""Shared pytest fixtures — relax auth for the test suite."""

import pytest

from app.config import settings


@pytest.fixture(autouse=True)
def _demo_test_settings(monkeypatch):
    """Tests run without mandatory auth; secrets are set for login/admin helpers."""
    monkeypatch.setattr(settings, "demo_auth_required", False)
    monkeypatch.setattr(settings, "demo_session_secret", "test-session-secret-for-pytest")
    monkeypatch.setattr(settings, "demo_admin_key", "ceyfi-demo-admin")
