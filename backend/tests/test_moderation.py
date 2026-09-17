from .conftest import signup


def test_block_and_unblock(client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    res = client.post(f"/api/users/{b['user']['id']}/block")
    assert res.status_code == 201

    dupe = client.post(f"/api/users/{b['user']['id']}/block")
    assert dupe.status_code == 409

    blocked = client.get("/api/users/blocked").get_json()["blocked"]
    assert any(u["email"] == "b@example.com" for u in blocked)

    unblock = client.delete(f"/api/users/{b['user']['id']}/block")
    assert unblock.status_code == 200


def test_blocked_user_excluded_from_search(client):
    a = signup(client, email="a@example.com").get_json()
    signup(client, email="b@example.com", name="B User")

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    users = client.get("/api/users").get_json()["users"]
    assert any(u["email"] == "b@example.com" for u in users)

    b_id = next(u["id"] for u in users if u["email"] == "b@example.com")
    client.post(f"/api/users/{b_id}/block")

    users_after = client.get("/api/users").get_json()["users"]
    assert not any(u["email"] == "b@example.com" for u in users_after)


def test_cannot_friend_request_blocked_user(client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    client.post(f"/api/users/{b['user']['id']}/block")
    res = client.post("/api/friends/requests", json={"to_id": b["user"]["id"]})
    assert res.status_code == 403


def test_report_user(client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    res = client.post(
        f"/api/users/{b['user']['id']}/report",
        json={"reason": "harassment", "details": "Sent inappropriate messages"},
    )
    assert res.status_code == 201


def test_report_invalid_reason(client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    res = client.post(f"/api/users/{b['user']['id']}/report", json={"reason": "not_a_real_reason"})
    assert res.status_code == 400


def make_admin_client(client, email):
    from app.extensions import db
    from app.models import User

    res = signup(client, email=email, name="Admin")
    user = User.query.filter_by(email=email).first()
    user.is_admin = True
    db.session.commit()
    return res.get_json()["token"]


def test_admin_can_list_and_update_reports(app, client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    client.post(f"/api/users/{b['user']['id']}/report", json={"reason": "spam"})

    with app.app_context():
        admin_token = make_admin_client(client, "admin@example.com")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {admin_token}"

    res = client.get("/api/admin/reports")
    assert res.status_code == 200
    reports = res.get_json()["reports"]
    assert len(reports) == 1

    update_res = client.patch(f"/api/admin/reports/{reports[0]['id']}", json={"status": "reviewed"})
    assert update_res.status_code == 200
    assert update_res.get_json()["status"] == "reviewed"


def test_non_admin_cannot_list_reports(auth_client):
    client, _ = auth_client
    res = client.get("/api/admin/reports")
    assert res.status_code == 403
