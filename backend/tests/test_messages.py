from .conftest import signup


def become_friends(client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    req = client.post("/api/friends/requests", json={"to_id": b["user"]["id"]}).get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {b['token']}"
    client.post(f"/api/friends/requests/{req['id']}/accept")

    return a, b


def test_cannot_message_non_friend(client):
    a = signup(client, email="a@example.com").get_json()
    b = signup(client, email="b@example.com", name="B User").get_json()

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    res = client.post(f"/api/messages/threads/{b['user']['id']}", json={"body": "Hey!"})
    assert res.status_code == 403


def test_friends_can_message_each_other(client):
    a, b = become_friends(client)

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    send_res = client.post(f"/api/messages/threads/{b['user']['id']}", json={"body": "Hey there!"})
    assert send_res.status_code == 201

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {b['token']}"
    thread = client.get(f"/api/messages/threads/{a['user']['id']}").get_json()
    assert len(thread["messages"]) == 1
    assert thread["messages"][0]["body"] == "Hey there!"

    threads_list = client.get("/api/messages/threads").get_json()["threads"]
    assert len(threads_list) == 1
    assert threads_list[0]["unread_count"] == 0  # marked read by the GET above


def test_message_too_long_rejected(client):
    a, b = become_friends(client)
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    res = client.post(f"/api/messages/threads/{b['user']['id']}", json={"body": "x" * 2001})
    assert res.status_code == 400


def test_blocked_users_cannot_message(client):
    a, b = become_friends(client)

    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {a['token']}"
    client.post(f"/api/users/{b['user']['id']}/block")

    res = client.post(f"/api/messages/threads/{b['user']['id']}", json={"body": "Hi"})
    assert res.status_code == 403
