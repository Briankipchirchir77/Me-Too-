from .conftest import signup


def test_forgot_password_returns_dev_token_in_testing(client):
    signup(client, email="reset@example.com")
    res = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert res.status_code == 200
    assert res.get_json()["dev_token"]


def test_forgot_password_unknown_email_is_generic(client):
    res = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert res.status_code == 200
    assert res.get_json()["dev_token"] is None


def test_reset_password_with_valid_token(client):
    signup(client, email="reset@example.com")
    token = client.post(
        "/api/auth/forgot-password", json={"email": "reset@example.com"}
    ).get_json()["dev_token"]

    reset_res = client.post(
        "/api/auth/reset-password", json={"token": token, "password": "newpassword123"}
    )
    assert reset_res.status_code == 200

    login_res = client.post(
        "/api/auth/login", json={"email": "reset@example.com", "password": "newpassword123"}
    )
    assert login_res.status_code == 200

    old_login = client.post(
        "/api/auth/login", json={"email": "reset@example.com", "password": "password123"}
    )
    assert old_login.status_code == 401


def test_reset_password_with_bad_token(client):
    res = client.post(
        "/api/auth/reset-password", json={"token": "not-a-real-token", "password": "newpassword123"}
    )
    assert res.status_code == 400


def test_verify_email(auth_client):
    client, user = auth_client
    assert user["is_verified"] is False

    from app.extensions import db
    from app.models import User

    db_user = User.query.filter_by(email=user["email"]).first()
    token = db_user.verification_token
    assert token

    res = client.post("/api/auth/verify-email", json={"token": token})
    assert res.status_code == 200

    me_res = client.get("/api/auth/me")
    assert me_res.get_json()["is_verified"] is True
