from flask import Blueprint, jsonify

from ..models import Interest

interests_bp = Blueprint("interests", __name__)

CATEGORY_META = {
    "hiking": {"label": "Hiking", "emoji": "🏔️"},
    "music": {"label": "Music", "emoji": "🎵"},
    "gaming": {"label": "Gaming", "emoji": "🎮"},
    "art": {"label": "Art & Design", "emoji": "🎨"},
    "travel": {"label": "Travel", "emoji": "✈️"},
    "food": {"label": "Food", "emoji": "🍜"},
    "fitness": {"label": "Fitness", "emoji": "💪"},
    "reading": {"label": "Reading", "emoji": "📚"},
    "technology": {"label": "Technology", "emoji": "💻"},
    "photography": {"label": "Photography", "emoji": "📷"},
    "nature": {"label": "Nature", "emoji": "🌿"},
    "yoga": {"label": "Yoga", "emoji": "🧘"},
    "fashion": {"label": "Fashion", "emoji": "👗"},
    "cooking": {"label": "Cooking", "emoji": "🍳"},
    "running": {"label": "Running", "emoji": "🏃"},
    "jazz": {"label": "Jazz & Afro", "emoji": "🎷"},
}


@interests_bp.get("")
def list_interests():
    interests = Interest.query.order_by(Interest.name).all()
    result = []
    for interest in interests:
        meta = CATEGORY_META.get(interest.name, {"label": interest.name.title(), "emoji": "✨"})
        result.append(
            {
                "id": interest.id,
                "name": interest.name,
                "label": meta["label"],
                "emoji": meta["emoji"],
                "user_count": interest.users.count(),
            }
        )
    return jsonify({"interests": result})
