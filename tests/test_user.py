import pytest
from httpx import AsyncClient
from app.main import app
import uuid


@pytest.mark.asyncio
async def test_register_and_login(client):
    email = f"user{uuid.uuid4().hex}@example.com"
    username = f"user{uuid.uuid4().hex}"
    password = "12345678"
    resp = await client.post(
        "/api/v1/user/register/",
        json={
            "email": email,
            "password": password,
            "username": username,
        },
    )
    print("REGISTER STATUS:", resp.status_code)
    print("REGISTER RESPONSE:", resp.text)
    assert resp.status_code in (200, 201)
    resp = await client.post(
        "/api/v1/user/login/", data={"username": email, "password": password}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
