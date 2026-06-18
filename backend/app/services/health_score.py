from typing import Literal


def compute_health_score(loan: dict) -> Literal["ON_TRACK", "AT_RISK", "CRITICAL"]:
    missed = loan.get("missed_payments", 0)
    overdue = loan.get("current_overdue_days", 0)
    if missed == 0 and overdue == 0:
        return "ON_TRACK"
    if missed <= 1 or overdue <= 30:
        return "AT_RISK"
    return "CRITICAL"


HEALTH_SUMMARY = {
    "ON_TRACK": "Your loan is in excellent health — all payments on time.",
    "AT_RISK": "Your loan needs attention — a missed or late payment has been detected.",
    "CRITICAL": "Your loan is in a critical state — please contact Seylan Bank immediately.",
}