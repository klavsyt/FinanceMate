import pytest


@pytest.mark.asyncio
async def test_category_crud(client, auth_headers):
    # Создать категорию
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "Еда", "type": "expense"},
        headers=auth_headers,
    )
    print("CATEGORY STATUS:", resp.status_code)
    print("CATEGORY RESPONSE:", resp.text)
    assert resp.status_code in (200, 201)
    category = resp.json()
    category_id = category["id"]

    # Получить список
    resp = await client.get("/api/v1/category/categories/", headers=auth_headers)
    assert resp.status_code == 200
    assert any(cat["id"] == category_id for cat in resp.json())

    # Обновить
    resp = await client.put(
        f"/api/v1/category/categories/{category_id}/",
        json={"name": "Продукты", "type": "expense"},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    # Удалить
    resp = await client.delete(
        f"/api/v1/category/categories/{category_id}/", headers=auth_headers
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_category_summary(client, auth_headers):
    resp = await client.get(
        "/api/v1/report/reports/category-summary/?year=2025", headers=auth_headers
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_category_validation_errors(client, auth_headers):
    # Пустое имя
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "", "type": "expense"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    # Неизвестный тип
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "Test", "type": "unknown"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    # Невалидный parent_id
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "Test", "type": "expense", "parent_id": -1},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_category_pagination(client, auth_headers):
    # Создать несколько категорий
    for i in range(5):
        await client.post(
            "/api/v1/category/categories/",
            json={"name": f"Cat{i}", "type": "expense"},
            headers=auth_headers,
        )
    # Получить только 2
    resp = await client.get(
        "/api/v1/category/categories/?limit=2&offset=0", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) <= 2


@pytest.mark.asyncio
async def test_category_unauthorized(client):
    resp = await client.get("/api/v1/category/categories/")
    assert resp.status_code in (401, 403)
