from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import ApiError
from ..extensions import db
from ..models import Event, EventRsvp
from ..utils import admin_required, require_fields

events_bp = Blueprint("events", __name__)

REQUIRED_EVENT_FIELDS = ["title", "category", "starts_at", "location", "capacity"]


def parse_event_payload(payload, partial=False):
    fields = {}

    if "title" in payload:
        fields["title"] = str(payload["title"]).strip()
    if "category" in payload:
        fields["category"] = str(payload["category"]).strip()
    if "location" in payload:
        fields["location"] = str(payload["location"]).strip()
    if "emoji" in payload:
        fields["emoji"] = (str(payload.get("emoji") or "").strip() or None)
    if "color" in payload:
        fields["color"] = (str(payload.get("color") or "").strip() or None)

    if "starts_at" in payload:
        raw = str(payload["starts_at"]).replace("Z", "+00:00")
        try:
            fields["starts_at"] = datetime.fromisoformat(raw)
        except ValueError:
            raise ApiError("starts_at must be a valid ISO 8601 datetime.", 400)

    if "capacity" in payload:
        try:
            capacity = int(payload["capacity"])
        except (TypeError, ValueError):
            raise ApiError("Capacity must be a number.", 400)
        if capacity < 1:
            raise ApiError("Capacity must be at least 1.", 400)
        fields["capacity"] = capacity

    if not partial:
        require_fields(payload, REQUIRED_EVENT_FIELDS)

    return fields


@events_bp.get("")
@jwt_required(optional=True)
def list_events():
    current_id = get_jwt_identity()
    current_id = int(current_id) if current_id else None

    category = (request.args.get("category") or "all").strip()
    query = Event.query
    if category.lower() != "all":
        query = query.filter(Event.category == category)
    events = query.order_by(Event.starts_at).all()
    return jsonify({"events": [e.to_dict(current_user_id=current_id) for e in events]})


@events_bp.get("/<int:event_id>")
@jwt_required(optional=True)
def get_event(event_id):
    current_id = get_jwt_identity()
    current_id = int(current_id) if current_id else None
    event = Event.query.get_or_404(event_id)
    return jsonify(event.to_dict(current_user_id=current_id))


@events_bp.post("/<int:event_id>/rsvp")
@jwt_required()
def rsvp(event_id):
    user_id = int(get_jwt_identity())
    event = Event.query.get_or_404(event_id)

    existing = EventRsvp.query.filter_by(event_id=event_id, user_id=user_id).first()
    if existing:
        raise ApiError("You've already RSVP'd to this event.", 409)
    if event.is_full():
        raise ApiError("This event is full.", 409)

    db.session.add(EventRsvp(event_id=event_id, user_id=user_id))
    db.session.commit()
    return jsonify(event.to_dict(current_user_id=user_id)), 201


@events_bp.delete("/<int:event_id>/rsvp")
@jwt_required()
def cancel_rsvp(event_id):
    user_id = int(get_jwt_identity())
    event = Event.query.get_or_404(event_id)

    existing = EventRsvp.query.filter_by(event_id=event_id, user_id=user_id).first()
    if not existing:
        raise ApiError("You haven't RSVP'd to this event.", 404)

    db.session.delete(existing)
    db.session.commit()
    return jsonify(event.to_dict(current_user_id=user_id))


@events_bp.post("")
@admin_required
def create_event():
    payload = request.get_json(silent=True) or {}
    fields = parse_event_payload(payload)
    event = Event(**fields)
    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201


@events_bp.patch("/<int:event_id>")
@admin_required
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    payload = request.get_json(silent=True) or {}
    fields = parse_event_payload(payload, partial=True)
    for key, value in fields.items():
        setattr(event, key, value)
    db.session.commit()
    return jsonify(event.to_dict())


@events_bp.delete("/<int:event_id>")
@admin_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return "", 204
