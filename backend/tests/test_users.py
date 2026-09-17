from .conftest import signup


def test_list_users_excludes_current_user(auth_client):
    client, user = auth_client
    signup(client, email="other@example.com", name="Other Person")
    res = client.get("/api/users")
    assert res.status_code == 200
    emails = [u["email"] for u in res.get_json()["users"]]
    assert user["email"] not in emails
    assert "other@example.com" in emails


def test_filter_by_location(client):
    signup(client, email="nairobi@example.com", location="Nairobi")
    signup(client, email="mombasa@example.com", name="Coastal Person", location="Mombasa")
    res = client.get("/api/users?location=mombasa")
    data = res.get_json()["users"]
    assert len(data) == 1
    assert data[0]["email"] == "mombasa@example.com"


def test_filter_by_interest(client):
    signup(client, email="hiker@example.com", interests="hiking")
    signup(client, email="gamer@example.com", name="Gamer", interests="gaming")
    res = client.get("/api/users?interest=hiking")
    data = res.get_json()["users"]
    assert len(data) == 1
    assert data[0]["email"] == "hiker@example.com"


def test_filter_by_age_range(client):
    signup(client, email="young@example.com", age=20)
    signup(client, email="old@example.com", name="Older Person", age=60)
    res = client.get("/api/users?min_age=50&max_age=70")
    data = res.get_json()["users"]
    assert len(data) == 1
    assert data[0]["email"] == "old@example.com"


def test_get_single_user(client):
    signup_res = signup(client)
    user_id = signup_res.get_json()["user"]["id"]
    res = client.get(f"/api/users/{user_id}")
    assert res.status_code == 200
    assert res.get_json()["id"] == user_id


def test_get_missing_user_404s(client):
    res = client.get("/api/users/999")
    assert res.status_code == 404
