from .conftest import signup


def login_as(client, email, password="password123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.get_json()["token"]


def test_send_accept_friend_flow(client):
    alice_res = signup(client, email="alice@example.com", name="Alice")
    alice = alice_res.get_json()["user"]
    alice_token = alice_res.get_json()["token"]

    bob_res = signup(client, email="bob@example.com", name="Bob")
    bob = bob_res.get_json()["user"]
    bob_token = bob_res.get_json()["token"]

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {alice_token}"
    send_res = client.post("/api/friends/requests", json={"to_id": bob["id"]})
    assert send_res.status_code == 201
    request_id = send_res.get_json()["id"]

    dupe_res = client.post("/api/friends/requests", json={"to_id": bob["id"]})
    assert dupe_res.status_code == 409

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {bob_token}"
    incoming = client.get("/api/friends/requests").get_json()["incoming"]
    assert len(incoming) == 1

    accept_res = client.post(f"/api/friends/requests/{request_id}/accept")
    assert accept_res.status_code == 200

    friends_res = client.get("/api/friends")
    friend_emails = [f["email"] for f in friends_res.get_json()["friends"]]
    assert "alice@example.com" in friend_emails


def test_decline_friend_request(client):
    alice_res = signup(client, email="alice@example.com", name="Alice")
    alice_token = alice_res.get_json()["token"]
    bob_res = signup(client, email="bob@example.com", name="Bob")
    bob = bob_res.get_json()["user"]
    bob_token = bob_res.get_json()["token"]

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {alice_token}"
    send_res = client.post("/api/friends/requests", json={"to_id": bob["id"]})
    request_id = send_res.get_json()["id"]

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {bob_token}"
    decline_res = client.post(f"/api/friends/requests/{request_id}/decline")
    assert decline_res.status_code == 200

    friends_res = client.get("/api/friends")
    assert friends_res.get_json()["friends"] == []


def test_cannot_friend_request_self(auth_client):
    client, user = auth_client
    res = client.post("/api/friends/requests", json={"to_id": user["id"]})
    assert res.status_code == 400
