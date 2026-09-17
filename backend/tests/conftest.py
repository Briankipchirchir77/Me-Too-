import pytest

from app import create_app
from app.extensions import db as _db


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def signup(client, **overrides):
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "age": 25,
        "location": "Nairobi",
        "gender": "female",
        "bio": "Hi there",
        "interests": "hiking, music",
    }
    payload.update(overrides)
    return client.post("/api/auth/signup", json=payload)


@pytest.fixture
def auth_client(client):
    res = signup(client)
    token = res.get_json()["token"]
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client, res.get_json()["user"]
