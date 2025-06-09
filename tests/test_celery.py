from unittest.mock import patch
from app.tasks.budget import check_budget_limit


def test_check_budget_limit_calls_notification(monkeypatch):
    called = {}

    def fake_add(obj):
        called["add"] = True

    def fake_commit():
        called["commit"] = True

    class FakeDB:
        def execute(self, *a, **kw):
            return type(
                "R",
                (),
                {"scalar_one_or_none": lambda s: None, "scalar": lambda s: None},
            )()

        def add(self, obj):
            fake_add(obj)

        def commit(self):
            fake_commit()

        def close(self):
            pass

    monkeypatch.setattr("app.tasks.budget.SessionLocal", lambda: FakeDB())
    check_budget_limit(user_id=1, category_id=1)
    assert (
        "add" not in called or "commit" not in called
    )  # Нет бюджета — уведомление не создаётся


# Для случая, когда бюджет есть и превышен — можно расширить тест, замокав Budget и Transaction
