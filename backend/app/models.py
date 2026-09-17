from datetime import datetime, timezone

from .extensions import bcrypt, db


def utcnow():
    return datetime.now(timezone.utc)


user_interests = db.Table(
    "user_interests",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("interest_id", db.Integer, db.ForeignKey("interests.id"), primary_key=True),
)


class Interest(db.Model):
    __tablename__ = "interests"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(120), nullable=True, index=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    verification_token = db.Column(db.String(100), nullable=True, index=True)
    reset_token = db.Column(db.String(100), nullable=True, index=True)
    reset_token_expires_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    interests = db.relationship(
        "Interest", secondary=user_interests, backref=db.backref("users", lazy="dynamic")
    )

    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    def to_dict(self, include_friend_count=False):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "age": self.age,
            "gender": self.gender,
            "bio": self.bio,
            "location": self.location,
            "interests": [i.name for i in self.interests],
            "is_admin": self.is_admin,
            "avatar_url": self.avatar_url,
            "is_verified": self.is_verified,
        }
        if include_friend_count:
            data["friend_count"] = self.friend_count()
        return data

    def friend_ids(self):
        sent = FriendRequest.query.filter_by(from_user_id=self.id, status="accepted").all()
        received = FriendRequest.query.filter_by(to_user_id=self.id, status="accepted").all()
        return {r.to_user_id for r in sent} | {r.from_user_id for r in received}

    def friend_count(self):
        return len(self.friend_ids())

    def is_friends_with(self, other_id):
        return other_id in self.friend_ids()

    def blocked_ids(self):
        blocked_by_me = {b.blocked_id for b in Block.query.filter_by(blocker_id=self.id).all()}
        blocking_me = {b.blocker_id for b in Block.query.filter_by(blocked_id=self.id).all()}
        return blocked_by_me | blocking_me

    def has_blocked(self, other_id):
        return Block.query.filter_by(blocker_id=self.id, blocked_id=other_id).first() is not None


class FriendRequest(db.Model):
    __tablename__ = "friend_requests"
    __table_args__ = (
        db.UniqueConstraint("from_user_id", "to_user_id", name="uq_friend_request_pair"),
    )

    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending|accepted|declined
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    from_user = db.relationship("User", foreign_keys=[from_user_id])
    to_user = db.relationship("User", foreign_keys=[to_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "from_user": self.from_user.to_dict(),
            "to_user": self.to_dict_to_user(),
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

    def to_dict_to_user(self):
        return self.to_user.to_dict()


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(60), nullable=False, index=True)
    starts_at = db.Column(db.DateTime(timezone=True), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    emoji = db.Column(db.String(10), nullable=True)
    color = db.Column(db.String(20), nullable=True)
    capacity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    rsvps = db.relationship("EventRsvp", backref="event", cascade="all, delete-orphan")

    def attendee_count(self):
        return len(self.rsvps)

    def is_full(self):
        return self.attendee_count() >= self.capacity

    def to_dict(self, current_user_id=None):
        rsvp_user_ids = {r.user_id for r in self.rsvps}
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "starts_at": self.starts_at.isoformat(),
            "location": self.location,
            "emoji": self.emoji,
            "color": self.color,
            "capacity": self.capacity,
            "attendee_count": self.attendee_count(),
            "is_full": self.is_full(),
            "is_rsvped": current_user_id in rsvp_user_ids if current_user_id else False,
        }


class EventRsvp(db.Model):
    __tablename__ = "event_rsvps"
    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", name="uq_event_rsvp_pair"),
    )

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class Block(db.Model):
    __tablename__ = "blocks"
    __table_args__ = (
        db.UniqueConstraint("blocker_id", "blocked_id", name="uq_block_pair"),
    )

    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    blocked_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reported_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.String(60), nullable=False)
    details = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="open")  # open|reviewed|dismissed
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    reporter = db.relationship("User", foreign_keys=[reporter_id])
    reported_user = db.relationship("User", foreign_keys=[reported_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "reporter": self.reporter.to_dict(),
            "reported_user": self.reported_user.to_dict(),
            "reason": self.reason,
            "details": self.details,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class Conversation(db.Model):
    __tablename__ = "conversations"
    __table_args__ = (
        db.UniqueConstraint("user_a_id", "user_b_id", name="uq_conversation_pair"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_a_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    messages = db.relationship(
        "Message", backref="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    @staticmethod
    def pair_key(user_id_a, user_id_b):
        return (user_id_a, user_id_b) if user_id_a < user_id_b else (user_id_b, user_id_a)

    @classmethod
    def get_or_create(cls, user_id_a, user_id_b):
        low, high = cls.pair_key(user_id_a, user_id_b)
        convo = cls.query.filter_by(user_a_id=low, user_b_id=high).first()
        if not convo:
            convo = cls(user_a_id=low, user_b_id=high)
            db.session.add(convo)
            db.session.commit()
        return convo

    def other_user_id(self, user_id):
        return self.user_b_id if user_id == self.user_a_id else self.user_a_id

    def to_dict(self, current_user_id):
        other = User.query.get(self.other_user_id(current_user_id))
        last = self.messages[-1] if self.messages else None
        unread = sum(
            1 for m in self.messages if m.sender_id != current_user_id and m.read_at is None
        )
        return {
            "id": self.id,
            "other_user": other.to_dict() if other else None,
            "last_message": last.to_dict() if last else None,
            "unread_count": unread,
        }


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    read_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender_id": self.sender_id,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None,
        }


class PushSubscription(db.Model):
    __tablename__ = "push_subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    endpoint = db.Column(db.String(500), unique=True, nullable=False)
    p256dh = db.Column(db.String(255), nullable=False)
    auth = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    def to_subscription_info(self):
        return {
            "endpoint": self.endpoint,
            "keys": {"p256dh": self.p256dh, "auth": self.auth},
        }
