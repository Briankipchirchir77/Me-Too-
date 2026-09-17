from datetime import datetime, timezone

from app.extensions import db
from app.models import Event

from .conftest import signup


def make_event(app, capacity=2, **overrides):
    with app.app_context():
        event = Event(
            title="Test Event",
            category="Tech",
            starts_at=datetime.now(timezone.utc),
            location="Nairobi",
            emoji="💻",
            color="#cce5ff",
            capacity=capacity,
        )
        for key, value in overrides.items():
            setattr(event, key, value)
        db.session.add(event)
        db.session.commit()
        return event.id


def test_list_events(app, client):
    make_event(app)
    res = client.get("/api/events")
    assert res.status_code == 200
    assert len(res.get_json()["events"]) == 1


def test_rsvp_and_cancel(app, auth_client):
    client, _ = auth_client
    event_id = make_event(app)

    res = client.post(f"/api/events/{event_id}/rsvp")
    assert res.status_code == 201
    assert res.get_json()["attendee_count"] == 1
    assert res.get_json()["is_rsvped"] is True

    dupe = client.post(f"/api/events/{event_id}/rsvp")
    assert dupe.status_code == 409

    cancel = client.delete(f"/api/events/{event_id}/rsvp")
    assert cancel.status_code == 200
    assert cancel.get_json()["attendee_count"] == 0


def test_rsvp_respects_capacity(app, client):
    event_id = make_event(app, capacity=1)

    token1 = signup(client, email="one@example.com").get_json()["token"]
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token1}"
    res1 = client.post(f"/api/events/{event_id}/rsvp")
    assert res1.status_code == 201

    token2 = signup(client, email="two@example.com", name="Second Person").get_json()["token"]
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token2}"
    res2 = client.post(f"/api/events/{event_id}/rsvp")
    assert res2.status_code == 409


def test_rsvp_requires_auth(app, client):
    event_id = make_event(app)
    res = client.post(f"/api/events/{event_id}/rsvp")
    assert res.status_code == 401
