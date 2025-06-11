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


@pytest.mark.asyncio
async def test_change_password(client):
    # Register and login
    email = f"user{uuid.uuid4().hex}@example.com"
    username = f"user{uuid.uuid4().hex}"
    password = "12345678"
    new_password = "87654321"
    resp = await client.post(
        "/api/v1/user/register/",
        json={"email": email, "password": password, "username": username},
    )
    assert resp.status_code in (200, 201)
    resp = await client.post(
        "/api/v1/user/login/", data={"username": email, "password": password}
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    # Change password
    resp = await client.post(
        "/api/v1/user/change-password/",
        headers={"Authorization": f"Bearer {token}"},
        json={"old_password": password, "new_password": new_password},
    )
    assert resp.status_code == 200
    # Login with new password
    resp = await client.post(
        "/api/v1/user/login/", data={"username": email, "password": new_password}
    )
    assert resp.status_code == 200
    # Login with old password should fail
    resp = await client.post(
        "/api/v1/user/login/", data={"username": email, "password": password}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_avatar(client):
    email = f"user{uuid.uuid4().hex}@example.com"
    username = f"user{uuid.uuid4().hex}"
    password = "12345678"
    avatar_url = "https://api.dicebear.com/7.x/bottts/svg?seed=cat"
    # Register
    resp = await client.post(
        "/api/v1/user/register/",
        json={"email": email, "password": password, "username": username},
    )
    assert resp.status_code in (200, 201)
    # Login
    resp = await client.post(
        "/api/v1/user/login/", data={"username": email, "password": password}
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    # Update avatar
    resp = await client.put(
        "/api/v1/user/me/",
        headers={"Authorization": f"Bearer {token}"},
        json={"avatar": avatar_url},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["avatar"] == avatar_url
    # Get profile
    resp = await client.get(
        "/api/v1/user/me/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["avatar"] == avatar_url
