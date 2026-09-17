from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from ..emailing import send_email
from ..errors import ApiError
from ..extensions import db, limiter
from ..models import Interest, User
from ..utils import (
    generate_token,
    parse_interests,
    require_fields,
    validate_age,
    validate_email,
    validate_password,
)

auth_bp = Blueprint("auth", __name__)

RESET_TOKEN_TTL = timedelta(hours=1)


def get_or_create_interests(names):
    interests = []
    for name in names:
        interest = Interest.query.filter_by(name=name).first()
        if not interest:
            interest = Interest(name=name)
            db.session.add(interest)
        interests.append(interest)
    return interests


@auth_bp.post("/signup")
@limiter.limit("10 per hour")
def signup():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["name", "email", "password", "age", "location"])

    email = payload["email"].strip().lower()
    validate_email(email)
    validate_password(payload["password"])
    age = validate_age(payload["age"])

    if User.query.filter_by(email=email).first():
        raise ApiError("Email already registered.", 409)

    user = User(
        name=payload["name"].strip(),
        email=email,
        age=age,
        gender=(payload.get("gender") or "").strip() or None,
        bio=(payload.get("bio") or "").strip() or None,
        location=payload["location"].strip(),
    )
    user.set_password(payload["password"])
    user.interests = get_or_create_interests(parse_interests(payload.get("interests")))
    user.verification_token = generate_token()

    db.session.add(user)
    db.session.commit()

    send_email(
        user.email,
        "Verify your Me Too! account",
        f"Welcome, {user.name}! Verify your email: "
        f"{current_app.config['FRONTEND_ORIGIN']}/?verify_token={user.verification_token}",
    )

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
@limiter.limit("20 per hour")
def login():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["email", "password"])

    email = payload["email"].strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(payload["password"]):
        raise ApiError("Invalid email or password.", 401)

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.to_dict(include_friend_count=True))


@auth_bp.post("/verify-email")
def verify_email():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["token"])
    user = User.query.filter_by(verification_token=payload["token"]).first()
    if not user:
        raise ApiError("Invalid or expired verification link.", 400)
    user.is_verified = True
    user.verification_token = None
    db.session.commit()
    return jsonify({"message": "Email verified."})


@auth_bp.post("/resend-verification")
@jwt_required()
@limiter.limit("5 per hour")
def resend_verification():
    user = User.query.get_or_404(int(get_jwt_identity()))
    if user.is_verified:
        return jsonify({"message": "Already verified."})
    user.verification_token = generate_token()
    db.session.commit()
    send_email(
        user.email,
        "Verify your Me Too! account",
        f"Verify your email: "
        f"{current_app.config['FRONTEND_ORIGIN']}/?verify_token={user.verification_token}",
    )
    return jsonify({"message": "Verification email sent."})


@auth_bp.post("/forgot-password")
@limiter.limit("5 per hour")
def forgot_password():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["email"])
    email = payload["email"].strip().lower()
    user = User.query.filter_by(email=email).first()
    # Always return a generic success message, whether or not the email
    # exists, so this endpoint can't be used to enumerate registered emails.
    if user:
        user.reset_token = generate_token()
        user.reset_token_expires_at = datetime.now(timezone.utc) + RESET_TOKEN_TTL
        db.session.commit()
        send_email(
            user.email,
            "Reset your Me Too! password",
            f"Reset your password: "
            f"{current_app.config['FRONTEND_ORIGIN']}/?reset_token={user.reset_token} "
            f"(expires in 1 hour)",
        )
    response = {"message": "If that email is registered, a reset link has been sent."}
    if current_app.config.get("TESTING") or current_app.config.get("DEBUG"):
        response["dev_token"] = user.reset_token if user else None
    return jsonify(response)


@auth_bp.post("/reset-password")
@limiter.limit("10 per hour")
def reset_password():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["token", "password"])
    validate_password(payload["password"])

    user = User.query.filter_by(reset_token=payload["token"]).first()
    expires_at = user.reset_token_expires_at if user else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not user or not expires_at or expires_at < datetime.now(timezone.utc):
        raise ApiError("Invalid or expired reset link.", 400)

    user.set_password(payload["password"])
    user.reset_token = None
    user.reset_token_expires_at = None
    db.session.commit()
    return jsonify({"message": "Password reset. You can now log in."})
