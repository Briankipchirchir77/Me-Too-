from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import PushSubscription
from ..utils import require_fields

push_bp = Blueprint("push", __name__)


@push_bp.get("/vapid-public-key")
def vapid_public_key():
    return jsonify({"public_key": current_app.config.get("VAPID_PUBLIC_KEY", "")})


@push_bp.post("/subscribe")
@jwt_required()
def subscribe():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["endpoint"])
    keys = payload.get("keys") or {}
    require_fields(keys, ["p256dh", "auth"])

    existing = PushSubscription.query.filter_by(endpoint=payload["endpoint"]).first()
    if existing:
        existing.user_id = user_id
        existing.p256dh = keys["p256dh"]
        existing.auth = keys["auth"]
    else:
        db.session.add(
            PushSubscription(
                user_id=user_id,
                endpoint=payload["endpoint"],
                p256dh=keys["p256dh"],
                auth=keys["auth"],
            )
        )
    db.session.commit()
    return jsonify({"message": "Subscribed."}), 201


@push_bp.post("/unsubscribe")
@jwt_required()
def unsubscribe():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["endpoint"])
    sub = PushSubscription.query.filter_by(endpoint=payload["endpoint"]).first()
    if sub:
        db.session.delete(sub)
        db.session.commit()
    return jsonify({"message": "Unsubscribed."})
