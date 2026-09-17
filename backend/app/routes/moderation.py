from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import ApiError
from ..extensions import db
from ..models import Block, Report, User
from ..utils import admin_required, require_fields

moderation_bp = Blueprint("moderation", __name__)

REPORT_REASONS = {"spam", "harassment", "fake_profile", "inappropriate_content", "other"}


@moderation_bp.post("/users/<int:user_id>/block")
@jwt_required()
def block_user(user_id):
    blocker_id = int(get_jwt_identity())
    if user_id == blocker_id:
        raise ApiError("You can't block yourself.", 400)
    if not User.query.get(user_id):
        raise ApiError("That user doesn't exist.", 404)
    if Block.query.filter_by(blocker_id=blocker_id, blocked_id=user_id).first():
        raise ApiError("You've already blocked this user.", 409)

    db.session.add(Block(blocker_id=blocker_id, blocked_id=user_id))
    db.session.commit()
    return jsonify({"message": "User blocked."}), 201


@moderation_bp.delete("/users/<int:user_id>/block")
@jwt_required()
def unblock_user(user_id):
    blocker_id = int(get_jwt_identity())
    block = Block.query.filter_by(blocker_id=blocker_id, blocked_id=user_id).first()
    if not block:
        raise ApiError("You haven't blocked this user.", 404)
    db.session.delete(block)
    db.session.commit()
    return jsonify({"message": "User unblocked."})


@moderation_bp.get("/users/blocked")
@jwt_required()
def list_blocked():
    user_id = int(get_jwt_identity())
    blocks = Block.query.filter_by(blocker_id=user_id).all()
    users = User.query.filter(User.id.in_([b.blocked_id for b in blocks])).all()
    return jsonify({"blocked": [u.to_dict() for u in users]})


@moderation_bp.post("/users/<int:user_id>/report")
@jwt_required()
def report_user(user_id):
    reporter_id = int(get_jwt_identity())
    if user_id == reporter_id:
        raise ApiError("You can't report yourself.", 400)
    if not User.query.get(user_id):
        raise ApiError("That user doesn't exist.", 404)

    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["reason"])
    reason = payload["reason"].strip().lower()
    if reason not in REPORT_REASONS:
        raise ApiError(f"reason must be one of: {', '.join(sorted(REPORT_REASONS))}.", 400)

    report = Report(
        reporter_id=reporter_id,
        reported_user_id=user_id,
        reason=reason,
        details=(payload.get("details") or "").strip() or None,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({"message": "Report submitted. Our team will review it."}), 201


@moderation_bp.get("/admin/reports")
@admin_required
def list_reports():
    status = request.args.get("status")
    query = Report.query
    if status:
        query = query.filter_by(status=status)
    reports = query.order_by(Report.created_at.desc()).all()
    return jsonify({"reports": [r.to_dict() for r in reports]})


@moderation_bp.patch("/admin/reports/<int:report_id>")
@admin_required
def update_report(report_id):
    report = Report.query.get_or_404(report_id)
    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or "").strip().lower()
    if status not in {"open", "reviewed", "dismissed"}:
        raise ApiError("status must be one of: open, reviewed, dismissed.", 400)
    report.status = status
    db.session.commit()
    return jsonify(report.to_dict())
