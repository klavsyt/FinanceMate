import pytest
from unittest.mock import patch

import app.crud.category as category_crud


@pytest.mark.asyncio
async def test_category_logging_create_update_delete(client, auth_headers):
    with patch.object(category_crud, "logger") as mock_logger:
        # CREATE
        resp = await client.post(
            "/api/v1/category/categories/",
            json={"name": "ЛогТест", "type": "expense"},
            headers=auth_headers,
        )
        assert resp.status_code in (200, 201)
        cat_id = resp.json()["id"]
        assert mock_logger.info.call_count >= 1
        assert any(
            "created category" in str(call.args[0])
            for call in mock_logger.info.call_args_list
        )

        # UPDATE
        resp = await client.put(
            f"/api/v1/category/categories/{cat_id}/",
            json={"name": "ЛогТест2", "type": "expense"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert any(
            "updated category" in str(call.args[0])
            for call in mock_logger.info.call_args_list
        )

        # DELETE
        resp = await client.delete(
            f"/api/v1/category/categories/{cat_id}/", headers=auth_headers
        )
        assert resp.status_code == 200
        assert any(
            "deleted category" in str(call.args[0])
            for call in mock_logger.info.call_args_list
        )
