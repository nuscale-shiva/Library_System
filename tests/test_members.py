import pytest


def test_create_member(client):
    response = client.post(
        "/members",
        json={
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "1234567890"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["email"] == "john.doe@example.com"
    assert data["phone"] == "1234567890"
    assert "id" in data
    assert "created_at" in data


def test_create_member_duplicate_email(client):
    member_data = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "9876543210"
    }

    response1 = client.post("/members", json=member_data)
    assert response1.status_code == 201

    response2 = client.post("/members", json=member_data)
    assert response2.status_code == 400
    assert "email already registered" in response2.json()["detail"].lower()


def test_create_member_invalid_email(client):
    response = client.post(
        "/members",
        json={
            "name": "Invalid Email User",
            "email": "invalid-email",
            "phone": "1234567890"
        }
    )
    assert response.status_code == 422


def test_list_members(client):
    client.post(
        "/members",
        json={
            "name": "Alice Smith",
            "email": "alice@example.com",
            "phone": "1111111111"
        }
    )
    client.post(
        "/members",
        json={
            "name": "Bob Johnson",
            "email": "bob@example.com",
            "phone": "2222222222"
        }
    )

    response = client.get("/members")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(m["email"] == "alice@example.com" for m in data)
    assert any(m["email"] == "bob@example.com" for m in data)


def test_get_member_by_id(client):
    create_response = client.post(
        "/members",
        json={
            "name": "Charlie Brown",
            "email": "charlie@example.com",
            "phone": "3333333333"
        }
    )
    member_id = create_response.json()["id"]

    response = client.get(f"/members/{member_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == member_id
    assert data["email"] == "charlie@example.com"


def test_get_member_not_found(client):
    response = client.get("/members/99999")
    assert response.status_code == 404


def test_update_member(client):
    create_response = client.post(
        "/members",
        json={
            "name": "David Wilson",
            "email": "david@example.com",
            "phone": "4444444444"
        }
    )
    member_id = create_response.json()["id"]

    update_response = client.put(
        f"/members/{member_id}",
        json={
            "name": "David Wilson Updated",
            "phone": "5555555555"
        }
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["name"] == "David Wilson Updated"
    assert data["phone"] == "5555555555"
    assert data["email"] == "david@example.com"


def test_delete_member(client):
    create_response = client.post(
        "/members",
        json={
            "name": "Eve Martinez",
            "email": "eve@example.com",
            "phone": "6666666666"
        }
    )
    member_id = create_response.json()["id"]

    delete_response = client.delete(f"/members/{member_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/members/{member_id}")
    assert get_response.status_code == 404


def test_delete_member_not_found(client):
    response = client.delete("/members/99999")
    assert response.status_code == 404
