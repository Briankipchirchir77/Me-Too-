import os
import uuid

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_

from ..errors import ApiError
from ..extensions import db
from ..models import Interest, User

users_bp = Blueprint("users", __name__)

ALLOWED_AVATAR_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


@users_bp.get("")
@jwt_required(optional=True)
def list_users():
    current_id = get_jwt_identity()
    current_id = int(current_id) if current_id else None

    query = User.query
    me = User.query.get(current_id) if current_id else None
    if current_id:
        query = query.filter(User.id != current_id)
        excluded = me.blocked_ids() if me else set()
        if excluded:
            query = query.filter(User.id.notin_(excluded))

    q = (request.args.get("q") or "").strip().lower()
    location = (request.args.get("location") or "").strip().lower()
    gender = (request.args.get("gender") or "any").strip().lower()
    interest = (request.args.get("interest") or "").strip().lower()

    try:
        min_age = int(request.args.get("min_age", 18))
    except ValueError:
        min_age = 18
    try:
        max_age = int(request.args.get("max_age", 120))
    except ValueError:
        max_age = 120
    if min_age > max_age:
        min_age, max_age = max_age, min_age

    try:
        page = max(int(request.args.get("page", 1)), 1)
    except ValueError:
        page = 1
    try:
        per_page = min(max(int(request.args.get("per_page", 20)), 1), 50)
    except ValueError:
        per_page = 20

    query = query.filter(User.age >= min_age, User.age <= max_age)
    if gender != "any":
        query = query.filter(User.gender == gender)
    if location:
        query = query.filter(User.location.ilike(f"%{location}%"))
    if interest:
        query = query.join(User.interests).filter(Interest.name.ilike(f"%{interest}%"))
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                User.name.ilike(like),
                User.bio.ilike(like),
                User.interests.any(Interest.name.ilike(like)),
            )
        )

    query = query.order_by(User.id).distinct()
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    friend_ids = me.friend_ids() if me else set()

    return jsonify(
        {
            "users": [
                {**u.to_dict(), "is_friend": u.id in friend_ids} for u in items
            ],
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    )


@users_bp.get("/<int:user_id>")
@jwt_required(optional=True)
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    current_id = get_jwt_identity()
    data = user.to_dict()
    if current_id:
        data["is_friend"] = user.is_friends_with(int(current_id))
    return jsonify(data)


@users_bp.post("/me/avatar")
@jwt_required()
def upload_avatar():
    user = User.query.get_or_404(int(get_jwt_identity()))

    if "file" not in request.files:
        raise ApiError("No file uploaded.", 400)
    file = request.files["file"]
    if not file.filename:
        raise ApiError("No file selected.", 400)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise ApiError(f"Allowed image types: {', '.join(sorted(ALLOWED_AVATAR_EXTENSIONS))}.", 400)

    try:
        from PIL import Image

        image = Image.open(file.stream)
        image.verify()
        file.stream.seek(0)
        image = Image.open(file.stream).convert("RGB")
        image.thumbnail((512, 512))
    except Exception:
        raise ApiError("That file isn't a valid image.", 400)

    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.jpg"
    image.save(os.path.join(upload_dir, filename), "JPEG", quality=85)

    _delete_avatar_file(user)

    user.avatar_url = f"/uploads/avatars/{filename}"
    db.session.commit()
    return jsonify(user.to_dict())


def _delete_avatar_file(user):
    if not user.avatar_url:
        return
    relative = user.avatar_url.removeprefix("/uploads/")
    old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], relative)
    if os.path.isfile(old_path):
        os.remove(old_path)


@users_bp.delete("/me/avatar")
@jwt_required()
def delete_avatar():
    user = User.query.get_or_404(int(get_jwt_identity()))
    _delete_avatar_file(user)
    user.avatar_url = None
    db.session.commit()
    return jsonify(user.to_dict())
