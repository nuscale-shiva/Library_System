import pytest


def test_create_book(client):
    response = client.post(
        "/books",
        json={
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "978-0-7432-7356-5"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "The Great Gatsby"
    assert data["author"] == "F. Scott Fitzgerald"
    assert data["isbn"] == "978-0-7432-7356-5"
    assert data["available"] is True
    assert "id" in data
    assert "created_at" in data


def test_create_book_duplicate_isbn(client):
    book_data = {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "978-0-452-28423-4"
    }

    response1 = client.post("/books", json=book_data)
    assert response1.status_code == 201

    response2 = client.post("/books", json=book_data)
    assert response2.status_code == 400
    assert "isbn already exists" in response2.json()["detail"].lower()


def test_list_books(client):
    client.post(
        "/books",
        json={
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "isbn": "978-0-06-112008-4"
        }
    )
    client.post(
        "/books",
        json={
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "isbn": "978-0-14-143951-8"
        }
    )

    response = client.get("/books")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(b["isbn"] == "978-0-06-112008-4" for b in data)
    assert any(b["isbn"] == "978-0-14-143951-8" for b in data)


def test_list_books_available_only(client):
    create_response = client.post(
        "/books",
        json={
            "title": "Available Book",
            "author": "Test Author",
            "isbn": "978-1-111-11111-1"
        }
    )
    book_id = create_response.json()["id"]

    client.put(
        f"/books/{book_id}",
        json={"available": False}
    )

    response = client.get("/books?available_only=true")
    assert response.status_code == 200
    data = response.json()
    assert all(b["available"] is True for b in data)


def test_get_book_by_id(client):
    create_response = client.post(
        "/books",
        json={
            "title": "The Catcher in the Rye",
            "author": "J.D. Salinger",
            "isbn": "978-0-316-76948-0"
        }
    )
    book_id = create_response.json()["id"]

    response = client.get(f"/books/{book_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == book_id
    assert data["isbn"] == "978-0-316-76948-0"


def test_get_book_not_found(client):
    response = client.get("/books/99999")
    assert response.status_code == 404


def test_update_book(client):
    create_response = client.post(
        "/books",
        json={
            "title": "Original Title",
            "author": "Original Author",
            "isbn": "978-2-222-22222-2"
        }
    )
    book_id = create_response.json()["id"]

    update_response = client.put(
        f"/books/{book_id}",
        json={
            "title": "Updated Title",
            "author": "Updated Author"
        }
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["title"] == "Updated Title"
    assert data["author"] == "Updated Author"
    assert data["isbn"] == "978-2-222-22222-2"


def test_update_book_availability(client):
    create_response = client.post(
        "/books",
        json={
            "title": "Test Book",
            "author": "Test Author",
            "isbn": "978-3-333-33333-3"
        }
    )
    book_id = create_response.json()["id"]

    update_response = client.put(
        f"/books/{book_id}",
        json={"available": False}
    )
    assert update_response.status_code == 200
    assert update_response.json()["available"] is False


def test_delete_book(client):
    create_response = client.post(
        "/books",
        json={
            "title": "Book to Delete",
            "author": "Delete Author",
            "isbn": "978-4-444-44444-4"
        }
    )
    book_id = create_response.json()["id"]

    delete_response = client.delete(f"/books/{book_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/books/{book_id}")
    assert get_response.status_code == 404


def test_delete_book_not_found(client):
    response = client.delete("/books/99999")
    assert response.status_code == 404
