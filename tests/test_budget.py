import pytest


@pytest.mark.asyncio
async def test_budget_crud(client, auth_headers):
    # Создать категорию
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "Развлечения", "type": "expense"},
        headers=auth_headers,
    )
    print("CATEGORY STATUS:", resp.status_code)
    print("CATEGORY RESPONSE:", resp.text)
    category_id = resp.json()["id"]

    # Создать бюджет
    resp = await client.post(
        "/api/v1/budget/budgets/",
        json={"category_id": category_id, "limit": 1000, "period": "monthly"},
        headers=auth_headers,
    )
    assert resp.status_code in (200, 201)
    budget = resp.json()
    budget_id = budget["id"]

    # Получить список
    resp = await client.get("/api/v1/budget/budgets/", headers=auth_headers)
    assert resp.status_code == 200
    assert any(b["id"] == budget_id for b in resp.json())

    # Обновить
    resp = await client.put(
        f"/api/v1/budget/budgets/{budget_id}/",
        json={"category_id": category_id, "limit": 1500, "period": "monthly"},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    # Удалить
    resp = await client.delete(
        f"/api/v1/budget/budgets/{budget_id}/", headers=auth_headers
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_budget_validation_errors(client, auth_headers):
    # Некорректный лимит
    resp = await client.post(
        "/api/v1/budget/budgets/",
        json={"category_id": 1, "limit": -100, "period": "monthly"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    # Некорректный period
    resp = await client.post(
        "/api/v1/budget/budgets/",
        json={"category_id": 1, "limit": 100, "period": "unknown"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    # Некорректный category_id
    resp = await client.post(
        "/api/v1/budget/budgets/",
        json={"category_id": -1, "limit": 100, "period": "monthly"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_budget_pagination(client, auth_headers):
    # Создать несколько бюджетов
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "Пагинация", "type": "expense"},
        headers=auth_headers,
    )
    category_id = resp.json()["id"]
    for i in range(5):
        await client.post(
            "/api/v1/budget/budgets/",
            json={"category_id": category_id, "limit": 100 + i, "period": "monthly"},
            headers=auth_headers,
        )
    resp = await client.get(
        "/api/v1/budget/budgets/?limit=2&offset=0", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) <= 2


@pytest.mark.asyncio
async def test_budget_unauthorized(client):
    resp = await client.get("/api/v1/budget/budgets/")
    assert resp.status_code in (401, 403)
