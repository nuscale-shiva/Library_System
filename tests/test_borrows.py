import pytest


@pytest.fixture
def sample_member(client):
    response = client.post(
        "/members",
        json={
            "name": "Test Member",
            "email": "test.member@example.com",
            "phone": "1234567890"
        }
    )
    return response.json()


@pytest.fixture
def sample_book(client):
    response = client.post(
        "/books",
        json={
            "title": "Test Book",
            "author": "Test Author",
            "isbn": "978-0-000-00000-0"
        }
    )
    return response.json()


def test_create_borrow(client, sample_member, sample_book):
    response = client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": sample_member["id"]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["book_id"] == sample_book["id"]
    assert data["member_id"] == sample_member["id"]
    assert data["is_returned"] is False
    assert "id" in data
    assert "borrowed_at" in data
    assert data["returned_at"] is None

    book_response = client.get(f"/books/{sample_book['id']}")
    assert book_response.json()["available"] is False


def test_create_borrow_book_not_available(client, sample_member, sample_book):
    client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": sample_member["id"]
        }
    )

    response = client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": sample_member["id"]
        }
    )
    assert response.status_code == 400
    assert "not available" in response.json()["detail"].lower()


def test_create_borrow_book_not_found(client, sample_member):
    response = client.post(
        "/borrow",
        json={
            "book_id": 99999,
            "member_id": sample_member["id"]
        }
    )
    assert response.status_code == 400


def test_create_borrow_member_not_found(client, sample_book):
    response = client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": 99999
        }
    )
    assert response.status_code == 201


def test_return_book(client, sample_member, sample_book):
    borrow_response = client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": sample_member["id"]
        }
    )
    borrow_id = borrow_response.json()["id"]

    return_response = client.post(f"/borrow/{borrow_id}/return")
    assert return_response.status_code == 200
    data = return_response.json()
    assert data["is_returned"] is True
    assert data["returned_at"] is not None

    book_response = client.get(f"/books/{sample_book['id']}")
    assert book_response.json()["available"] is True


def test_return_book_already_returned(client, sample_member, sample_book):
    borrow_response = client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": sample_member["id"]
        }
    )
    borrow_id = borrow_response.json()["id"]

    client.post(f"/borrow/{borrow_id}/return")

    response = client.post(f"/borrow/{borrow_id}/return")
    assert response.status_code == 400
    assert "already returned" in response.json()["detail"].lower()


def test_return_book_not_found(client):
    response = client.post("/borrow/99999/return")
    assert response.status_code == 400


def test_list_borrows(client, sample_member):
    book1_response = client.post(
        "/books",
        json={
            "title": "Book 1",
            "author": "Author 1",
            "isbn": "978-1-111-11111-1"
        }
    )
    book2_response = client.post(
        "/books",
        json={
            "title": "Book 2",
            "author": "Author 2",
            "isbn": "978-2-222-22222-2"
        }
    )

    client.post(
        "/borrow",
        json={
            "book_id": book1_response.json()["id"],
            "member_id": sample_member["id"]
        }
    )
    client.post(
        "/borrow",
        json={
            "book_id": book2_response.json()["id"],
            "member_id": sample_member["id"]
        }
    )

    response = client.get("/borrow")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


def test_list_active_borrows(client, sample_member):
    book1_response = client.post(
        "/books",
        json={
            "title": "Active Book",
            "author": "Author",
            "isbn": "978-3-333-33333-3"
        }
    )
    book2_response = client.post(
        "/books",
        json={
            "title": "Returned Book",
            "author": "Author",
            "isbn": "978-4-444-44444-4"
        }
    )

    borrow1_response = client.post(
        "/borrow",
        json={
            "book_id": book1_response.json()["id"],
            "member_id": sample_member["id"]
        }
    )
    borrow2_response = client.post(
        "/borrow",
        json={
            "book_id": book2_response.json()["id"],
            "member_id": sample_member["id"]
        }
    )

    client.post(f"/borrow/{borrow2_response.json()['id']}/return")

    response = client.get("/borrow?active_only=true")
    assert response.status_code == 200
    data = response.json()
    assert all(b["is_returned"] is False for b in data)


def test_get_borrow_by_id(client, sample_member, sample_book):
    borrow_response = client.post(
        "/borrow",
        json={
            "book_id": sample_book["id"],
            "member_id": sample_member["id"]
        }
    )
    borrow_id = borrow_response.json()["id"]

    response = client.get(f"/borrow/{borrow_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == borrow_id


def test_get_borrow_not_found(client):
    response = client.get("/borrow/99999")
    assert response.status_code == 404


def test_get_member_borrows(client, sample_member):
    book1_response = client.post(
        "/books",
        json={
            "title": "Member Book 1",
            "author": "Author",
            "isbn": "978-5-555-55555-5"
        }
    )
    book2_response = client.post(
        "/books",
        json={
            "title": "Member Book 2",
            "author": "Author",
            "isbn": "978-6-666-66666-6"
        }
    )

    client.post(
        "/borrow",
        json={
            "book_id": book1_response.json()["id"],
            "member_id": sample_member["id"]
        }
    )
    client.post(
        "/borrow",
        json={
            "book_id": book2_response.json()["id"],
            "member_id": sample_member["id"]
        }
    )

    response = client.get(f"/borrow/member/{sample_member['id']}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(b["member_id"] == sample_member["id"] for b in data)
