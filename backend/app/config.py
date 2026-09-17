import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB upload cap
    # Self-generated (no external push service account needed) via: vapid_gen_keys()
    VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
    VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
    VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@example.com")
    SENTRY_DSN = os.environ.get("SENTRY_DSN", "")


class DevConfig(BaseConfig):
    # No host -> libpq connects over the local Unix socket using peer
    # authentication for the current OS user, instead of TCP (which needs a password).
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql:///metoo_dev")
    DEBUG = True


class ProdConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    DEBUG = False


class TestConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    TESTING = True
    JWT_SECRET_KEY = "test-secret"


CONFIG_BY_NAME = {
    "development": DevConfig,
    "production": ProdConfig,
    "testing": TestConfig,
}
