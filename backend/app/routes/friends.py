from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_

from ..errors import ApiError
from ..extensions import db
from ..models import FriendRequest, User
from ..push import notify_user

friends_bp = Blueprint("friends", __name__)


@friends_bp.post("/requests")
@jwt_required()
def send_request():
    from_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    to_id = payload.get("to_id")
    if not to_id:
        raise ApiError("Missing required field: to_id.", 400)
    to_id = int(to_id)

    if to_id == from_id:
        raise ApiError("You can't send a friend request to yourself.", 400)

    to_user = User.query.get(to_id)
    if not to_user:
        raise ApiError("That user doesn't exist.", 404)

    from_user = User.query.get(from_id)
    if from_user.is_friends_with(to_id):
        raise ApiError("You're already friends.", 409)
    if from_user.has_blocked(to_id) or to_user.has_blocked(from_id):
        raise ApiError("You can't connect with this user.", 403)

    existing = FriendRequest.query.filter_by(
        from_user_id=from_id, to_user_id=to_id, status="pending"
    ).first()
    if existing:
        raise ApiError("Friend request already sent.", 409)

    reverse = FriendRequest.query.filter_by(
        from_user_id=to_id, to_user_id=from_id, status="pending"
    ).first()
    if reverse:
        reverse.status = "accepted"
        db.session.commit()
        notify_user(to_id, title="New friend! 🎉", body=f"You and {from_user.name} are now friends.")
        return jsonify(reverse.to_dict()), 200

    stale = FriendRequest.query.filter_by(from_user_id=from_id, to_user_id=to_id).first()
    if stale:
        stale.status = "pending"
        req = stale
    else:
        req = FriendRequest(from_user_id=from_id, to_user_id=to_id, status="pending")
        db.session.add(req)
    db.session.commit()
    notify_user(
        to_id,
        title="New friend request",
        body=f"{from_user.name} wants to connect.",
        data={"type": "friend_request", "from_user_id": from_id},
    )
    return jsonify(req.to_dict()), 201


@friends_bp.get("/requests")
@jwt_required()
def list_requests():
    user_id = int(get_jwt_identity())
    incoming = FriendRequest.query.filter_by(to_user_id=user_id, status="pending").all()
    outgoing = FriendRequest.query.filter_by(from_user_id=user_id, status="pending").all()
    return jsonify(
        {
            "incoming": [r.to_dict() for r in incoming],
            "outgoing": [r.to_dict() for r in outgoing],
        }
    )


def _get_owned_request(request_id, user_id):
    req = FriendRequest.query.get(request_id)
    if not req or req.to_user_id != user_id:
        raise ApiError("Friend request not found.", 404)
    if req.status != "pending":
        raise ApiError("This request has already been handled.", 409)
    return req


@friends_bp.post("/requests/<int:request_id>/accept")
@jwt_required()
def accept_request(request_id):
    user_id = int(get_jwt_identity())
    req = _get_owned_request(request_id, user_id)
    req.status = "accepted"
    db.session.commit()
    to_user = User.query.get(user_id)
    notify_user(
        req.from_user_id,
        title="Friend request accepted! 🎉",
        body=f"{to_user.name} accepted your friend request.",
    )
    return jsonify(req.to_dict())


@friends_bp.post("/requests/<int:request_id>/decline")
@jwt_required()
def decline_request(request_id):
    user_id = int(get_jwt_identity())
    req = _get_owned_request(request_id, user_id)
    req.status = "declined"
    db.session.commit()
    return jsonify(req.to_dict())


@friends_bp.get("")
@jwt_required()
def list_friends():
    user_id = int(get_jwt_identity())
    accepted = FriendRequest.query.filter(
        FriendRequest.status == "accepted",
        or_(FriendRequest.from_user_id == user_id, FriendRequest.to_user_id == user_id),
    ).all()
    friend_ids = [
        r.to_user_id if r.from_user_id == user_id else r.from_user_id for r in accepted
    ]
    friends = User.query.filter(User.id.in_(friend_ids)).all()
    return jsonify({"friends": [f.to_dict() for f in friends]})
