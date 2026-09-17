import os

from flask import Flask, send_from_directory

from .config import CONFIG_BY_NAME
from .errors import register_error_handlers
from .extensions import bcrypt, cors, db, jwt, limiter, migrate


def create_app(config_name=None):
    app = Flask(__name__)
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(CONFIG_BY_NAME[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}})
    limiter.init_app(app)
    if app.config.get("TESTING"):
        limiter.enabled = False

    sentry_dsn = app.config.get("SENTRY_DSN")
    if sentry_dsn:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration

        sentry_sdk.init(dsn=sentry_dsn, integrations=[FlaskIntegration()], traces_sample_rate=0.1)

    register_error_handlers(app)

    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.friends import friends_bp
    from .routes.events import events_bp
    from .routes.interests import interests_bp
    from .routes.moderation import moderation_bp
    from .routes.messages import messages_bp
    from .routes.push import push_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(friends_bp, url_prefix="/api/friends")
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.register_blueprint(interests_bp, url_prefix="/api/interests")
    app.register_blueprint(moderation_bp, url_prefix="/api")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(push_bp, url_prefix="/api/push")

    from . import seed as seed_module

    seed_module.register_cli(app)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/uploads/<path:subpath>")
    def uploaded_file(subpath):
        return send_from_directory(app.config["UPLOAD_FOLDER"], subpath)

    return app
