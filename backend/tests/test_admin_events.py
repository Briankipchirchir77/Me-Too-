from app.extensions import db
from app.models import User

from .conftest import signup


def make_admin(client, email="admin@example.com"):
    res = signup(client, email=email, name="Admin User")
    user = User.query.filter_by(email=email).first()
    user.is_admin = True
    db.session.commit()
    token = res.get_json()["token"]
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client


VALID_EVENT = {
    "title": "Community Cleanup",
    "category": "Outdoors",
    "starts_at": "2026-10-01T09:00:00",
    "location": "Uhuru Park, Nairobi",
    "capacity": 25,
    "emoji": "🧹",
    "color": "#d4edda",
}


def test_non_admin_cannot_create_event(auth_client):
    client, _ = auth_client
    res = client.post("/api/events", json=VALID_EVENT)
    assert res.status_code == 403


def test_admin_can_create_event(app, client):
    with app.app_context():
        make_admin(client)
    res = client.post("/api/events", json=VALID_EVENT)
    assert res.status_code == 201
    data = res.get_json()
    assert data["title"] == "Community Cleanup"
    assert data["attendee_count"] == 0


def test_create_event_requires_fields(app, client):
    with app.app_context():
        make_admin(client)
    res = client.post("/api/events", json={"title": "Missing Stuff"})
    assert res.status_code == 400


def test_admin_can_update_event(app, client):
    with app.app_context():
        make_admin(client)
    created = client.post("/api/events", json=VALID_EVENT).get_json()
    res = client.patch(f"/api/events/{created['id']}", json={"title": "Updated Title", "capacity": 40})
    assert res.status_code == 200
    data = res.get_json()
    assert data["title"] == "Updated Title"
    assert data["capacity"] == 40


def test_admin_can_delete_event(app, client):
    with app.app_context():
        make_admin(client)
    created = client.post("/api/events", json=VALID_EVENT).get_json()
    res = client.delete(f"/api/events/{created['id']}")
    assert res.status_code == 204
    get_res = client.get(f"/api/events/{created['id']}")
    assert get_res.status_code == 404


def test_non_admin_cannot_delete_event(app, client):
    regular_token = signup(client, email="regular@example.com").get_json()["token"]

    with app.app_context():
        make_admin(client, email="admin2@example.com")
    created = client.post("/api/events", json=VALID_EVENT).get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {regular_token}"
    res = client.delete(f"/api/events/{created['id']}")
    assert res.status_code == 403
