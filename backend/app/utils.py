import re
import secrets
from functools import wraps

from flask_jwt_extended import get_jwt_identity, jwt_required

from .errors import ApiError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def generate_token():
    return secrets.token_urlsafe(32)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        from .models import User

        user = User.query.get(int(get_jwt_identity()))
        if not user or not user.is_admin:
            raise ApiError("Admin access required.", 403)
        return fn(*args, **kwargs)

    return wrapper


def require_fields(payload, fields):
    missing = [f for f in fields if not str(payload.get(f, "")).strip()]
    if missing:
        raise ApiError(f"Missing required field(s): {', '.join(missing)}.", 400)


def validate_email(email):
    if not EMAIL_RE.match(email or ""):
        raise ApiError("Please provide a valid email address.", 400)


def validate_password(password):
    if not password or len(password) < 6:
        raise ApiError("Password must be at least 6 characters.", 400)


def validate_age(age):
    try:
        age = int(age)
    except (TypeError, ValueError):
        raise ApiError("Age must be a number.", 400)
    if age < 18 or age > 120:
        raise ApiError("Age must be between 18 and 120.", 400)
    return age


def parse_interests(raw):
    if isinstance(raw, list):
        items = raw
    else:
        items = str(raw or "").split(",")
    cleaned = []
    seen = set()
    for item in items:
        name = str(item).strip().lower()
        if name and name not in seen:
            seen.add(name)
            cleaned.append(name)
    return cleaned
