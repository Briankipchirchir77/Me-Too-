from .conftest import signup


def test_signup_creates_user_and_returns_token(client):
    res = signup(client)
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["email"] == "test@example.com"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]
    assert data["user"]["interests"] == ["hiking", "music"]
    assert data["token"]


def test_signup_rejects_duplicate_email(client):
    signup(client)
    res = signup(client, name="Another Person")
    assert res.status_code == 409


def test_signup_rejects_short_password(client):
    res = signup(client, password="123")
    assert res.status_code == 400


def test_signup_rejects_missing_fields(client):
    res = client.post("/api/auth/signup", json={"email": "a@b.com"})
    assert res.status_code == 400


def test_login_with_correct_credentials(client):
    signup(client)
    res = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert res.status_code == 200
    assert res.get_json()["token"]


def test_login_with_wrong_password(client):
    signup(client)
    res = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert res.status_code == 401


def test_me_requires_auth(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_returns_current_user(auth_client):
    client, user = auth_client
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.get_json()["email"] == user["email"]
