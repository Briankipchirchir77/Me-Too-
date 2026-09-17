from datetime import datetime, timedelta, timezone

import click

from .extensions import db
from .models import Event, Interest, User

DEMO_USERS = [
    dict(name="Alice Wanjiru", email="alice@example.com", password="password123", age=25,
         gender="female", location="Nairobi",
         bio="Love hiking and reading. Always up for a good book club or trail walk!",
         interests=["hiking", "reading", "travel"]),
    dict(name="Bob Kamau", email="bob@example.com", password="password123", age=30,
         gender="male", location="Nairobi",
         bio="Tech enthusiast and gamer. Looking for friends to debate gadgets with.",
         interests=["gaming", "technology", "coding"]),
    dict(name="Cynthia Omollo", email="cyn@example.com", password="password123", age=45,
         gender="female", location="Mombasa",
         bio="Foodie and travel addict. Just back from Zanzibar — let's swap stories!",
         interests=["travel", "food", "photography"]),
    dict(name="Derek Mwangi", email="derek@example.com", password="password123", age=68,
         gender="male", location="Nairobi",
         bio="Music producer by night, accountant by day. Love jazz and afrobeats.",
         interests=["music", "afrobeats", "jazz"]),
    dict(name="Esther Njoki", email="esther@example.com", password="password123", age=22,
         gender="female", location="Nairobi",
         bio="Fashion designer & artist. Looking for creative minds to collab with!",
         interests=["art", "fashion", "design"]),
    dict(name="Frank Odhiambo", email="frank@example.com", password="password123", age=35,
         gender="male", location="Kisumu",
         bio="Marathon runner and fitness coach. If you run, let's train together!",
         interests=["running", "fitness", "nature"]),
    dict(name="Scott Martha Awuor", email="scott@example.com", password="password123", age=28,
         gender="female", location="Berlin",
         bio="Chess player and tech guru runner.",
         interests=["fashion", "hiking", "coding", "nature"]),
    dict(name="Brian Kipchirchir", email="briankipchirchir964@gmail.com", password="CHROMETE",
         age=27, gender="male", location="Paris",
         bio="Music producer by night, accountant by day. Love jazz and afrobeats.",
         interests=["sleeping", "hiking", "public speaking", "nature"], is_admin=True),
]

EVENTS = [
    dict(title="Karura Forest Morning Hike", category="Outdoors", days_from_now=3, hour=6, minute=30,
         location="Karura Forest, Nairobi", attendees=18, max=30, emoji="🏔️", color="#d4edda"),
    dict(title="Nairobi Jazz Night", category="Music", days_from_now=2, hour=19, minute=0,
         location="Alliance Française, Nairobi", attendees=42, max=60, emoji="🎷", color="#fff3cd"),
    dict(title="Tech Meetup — AI & Future", category="Tech", days_from_now=1, hour=17, minute=30,
         location="iHub, Nairobi", attendees=65, max=80, emoji="💻", color="#cce5ff"),
    dict(title="Nairobi Street Food Tour", category="Food", days_from_now=4, hour=11, minute=0,
         location="Westlands, Nairobi", attendees=12, max=20, emoji="🍜", color="#fde8d8"),
    dict(title="5K Run for Charity", category="Sports", days_from_now=3, hour=7, minute=0,
         location="Uhuru Park, Nairobi", attendees=89, max=150, emoji="🏃", color="#f8d7da"),
    dict(title="Watercolour Painting Workshop", category="Arts", days_from_now=3, hour=14, minute=0,
         location="GoDown Arts Centre, Nairobi", attendees=9, max=15, emoji="🎨", color="#e2d9f3"),
    dict(title="Mombasa Beach Volleyball", category="Sports", days_from_now=4, hour=9, minute=0,
         location="Diani Beach, Mombasa", attendees=14, max=24, emoji="🏐", color="#f8d7da"),
    dict(title="Afrobeats Dance Class", category="Arts", days_from_now=0, hour=18, minute=0,
         location="Parklands, Nairobi", attendees=22, max=30, emoji="💃", color="#e2d9f3"),
    dict(title="Python for Beginners Bootcamp", category="Tech", days_from_now=3, hour=10, minute=0,
         location="Strathmore University", attendees=35, max=50, emoji="🐍", color="#cce5ff"),
    dict(title="Farmers Market & Brunch", category="Food", days_from_now=4, hour=9, minute=0,
         location="Karen, Nairobi", attendees=55, max=100, emoji="🥗", color="#fde8d8"),
    dict(title="Lake Nakuru Day Trip", category="Outdoors", days_from_now=3, hour=5, minute=0,
         location="Lake Nakuru National Park", attendees=8, max=12, emoji="🦩", color="#d4edda"),
    dict(title="Open Mic Night", category="Music", days_from_now=2, hour=20, minute=0,
         location="The Alchemist, Westlands", attendees=30, max=50, emoji="🎤", color="#fff3cd"),
]


def get_or_create_interest(name):
    interest = Interest.query.filter_by(name=name).first()
    if not interest:
        interest = Interest(name=name)
        db.session.add(interest)
    return interest


def seed_database():
    if User.query.first():
        click.echo("Database already has data — skipping seed.")
        return

    for raw in DEMO_USERS:
        user = User(
            name=raw["name"],
            email=raw["email"],
            age=raw["age"],
            gender=raw["gender"],
            bio=raw["bio"],
            location=raw["location"],
            is_admin=raw.get("is_admin", False),
        )
        user.set_password(raw["password"])
        user.interests = [get_or_create_interest(name) for name in raw["interests"]]
        user.is_verified = True
        db.session.add(user)

    now = datetime.now(timezone.utc)
    for raw in EVENTS:
        starts_at = (now + timedelta(days=raw["days_from_now"])).replace(
            hour=raw["hour"], minute=raw["minute"], second=0, microsecond=0
        )
        event = Event(
            title=raw["title"],
            category=raw["category"],
            starts_at=starts_at,
            location=raw["location"],
            emoji=raw["emoji"],
            color=raw["color"],
            capacity=raw["max"],
        )
        db.session.add(event)

    for name in [
        "hiking", "music", "gaming", "art", "travel", "food", "fitness", "reading",
        "technology", "photography", "nature", "yoga", "fashion", "cooking", "running", "jazz",
    ]:
        get_or_create_interest(name)

    db.session.commit()
    click.echo(f"Seeded {len(DEMO_USERS)} users and {len(EVENTS)} events.")


def register_cli(app):
    @app.cli.command("seed")
    def seed_command():
        """Seed the database with demo users, interests, and events."""
        seed_database()
