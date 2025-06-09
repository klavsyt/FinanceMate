import pytest
from datetime import date


@pytest.mark.asyncio
async def test_transaction_crud(client, auth_headers):
    # Создать категорию
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "Транспорт", "type": "expense"},
        headers=auth_headers,
    )
    category_id = resp.json()["id"]

    # Создать транзакцию
    resp = await client.post(
        "/api/v1/transaction/transactions/",
        json={
            "amount": 100.5,
            "date": str(date.today()),
            "currency": "RUB",
            "comment": "Метро",
            "category_id": category_id,
        },
        headers=auth_headers,
    )
    assert resp.status_code in (200, 201)
    tx = resp.json()
    tx_id = tx["id"]

    # Получить список
    resp = await client.get("/api/v1/transaction/transactions/", headers=auth_headers)
    assert resp.status_code == 200
    assert any(t["id"] == tx_id for t in resp.json())

    # Обновить
    resp = await client.put(
        f"/api/v1/transaction/transactions/{tx_id}",
        json={
            "amount": 120.0,
            "date": str(date.today()),
            "currency": "RUB",
            "comment": "Такси",
            "category_id": category_id,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200

    # Удалить
    resp = await client.delete(
        f"/api/v1/transaction/transactions/{tx_id}", headers=auth_headers
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_transaction_validation_errors(client, auth_headers):
    # Некорректная сумма
    resp = await client.post(
        "/api/v1/transaction/transactions/",
        json={"amount": -10, "date": "2025-06-09", "currency": "RUB", "category_id": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    # Некорректная валюта
    resp = await client.post(
        "/api/v1/transaction/transactions/",
        json={"amount": 10, "date": "2025-06-09", "currency": "RU", "category_id": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    # Некорректный category_id
    resp = await client.post(
        "/api/v1/transaction/transactions/",
        json={"amount": 10, "date": "2025-06-09", "currency": "RUB", "category_id": -1},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_transaction_pagination(client, auth_headers):
    resp = await client.post(
        "/api/v1/category/categories/",
        json={"name": "ПагинацияТр", "type": "expense"},
        headers=auth_headers,
    )
    category_id = resp.json()["id"]
    for i in range(5):
        await client.post(
            "/api/v1/transaction/transactions/",
            json={
                "amount": 10 + i,
                "date": "2025-06-09",
                "currency": "RUB",
                "category_id": category_id,
            },
            headers=auth_headers,
        )
    resp = await client.get(
        "/api/v1/transaction/transactions/?limit=2&offset=0", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) <= 2


@pytest.mark.asyncio
async def test_transaction_unauthorized(client):
    resp = await client.get("/api/v1/transaction/transactions/")
    assert resp.status_code in (401, 403)
