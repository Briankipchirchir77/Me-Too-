import json
import logging

from flask import current_app

logger = logging.getLogger("metoo.push")


def notify_user(user_id, title, body, data=None):
    from .models import PushSubscription  # avoid circular import at module load time

    private_key = current_app.config.get("VAPID_PRIVATE_KEY")
    if not private_key:
        logger.info("push (no VAPID key configured) to=%s title=%r body=%r", user_id, title, body)
        return

    from pywebpush import WebPushException, webpush

    subs = PushSubscription.query.filter_by(user_id=user_id).all()
    payload = json.dumps({"title": title, "body": body, "data": data or {}})
    for sub in subs:
        try:
            webpush(
                subscription_info=sub.to_subscription_info(),
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={"sub": current_app.config["VAPID_CLAIM_EMAIL"]},
            )
        except WebPushException:
            logger.warning("push delivery failed for subscription %s", sub.id, exc_info=True)
