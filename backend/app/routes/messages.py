from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_

from ..errors import ApiError
from ..extensions import db
from ..models import Conversation, Message, User
from ..push import notify_user
from ..utils import require_fields

messages_bp = Blueprint("messages", __name__)


@messages_bp.get("/threads")
@jwt_required()
def list_threads():
    user_id = int(get_jwt_identity())
    conversations = Conversation.query.filter(
        or_(Conversation.user_a_id == user_id, Conversation.user_b_id == user_id)
    ).all()
    threads = [c.to_dict(user_id) for c in conversations]
    threads.sort(key=lambda t: t["last_message"]["created_at"] if t["last_message"] else "", reverse=True)
    return jsonify({"threads": threads})


def _get_friend_or_404(user_id, other_id):
    me = User.query.get_or_404(user_id)
    other = User.query.get(other_id)
    if not other:
        raise ApiError("That user doesn't exist.", 404)
    if not me.is_friends_with(other_id):
        raise ApiError("You can only message friends.", 403)
    if me.has_blocked(other_id) or other.has_blocked(user_id):
        raise ApiError("You can't message this user.", 403)
    return me, other


@messages_bp.get("/threads/<int:other_id>")
@jwt_required()
def get_thread(other_id):
    user_id = int(get_jwt_identity())
    _get_friend_or_404(user_id, other_id)

    convo = Conversation.get_or_create(user_id, other_id)
    unread = [m for m in convo.messages if m.sender_id != user_id and m.read_at is None]
    if unread:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        for m in unread:
            m.read_at = now
        db.session.commit()

    return jsonify(
        {
            "conversation_id": convo.id,
            "other_user": User.query.get(other_id).to_dict(),
            "messages": [m.to_dict() for m in convo.messages],
        }
    )


@messages_bp.post("/threads/<int:other_id>")
@jwt_required()
def send_message(other_id):
    user_id = int(get_jwt_identity())
    me, other = _get_friend_or_404(user_id, other_id)

    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["body"])
    body = payload["body"].strip()
    if len(body) > 2000:
        raise ApiError("Message is too long (max 2000 characters).", 400)

    convo = Conversation.get_or_create(user_id, other_id)
    message = Message(conversation_id=convo.id, sender_id=user_id, body=body)
    db.session.add(message)
    db.session.commit()

    notify_user(
        other.id,
        title=f"New message from {me.name}",
        body=body[:120],
        data={"type": "message", "from_user_id": user_id},
    )

    return jsonify(message.to_dict()), 201
