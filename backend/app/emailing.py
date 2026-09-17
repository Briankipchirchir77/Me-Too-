import logging

logger = logging.getLogger("metoo.email")


def send_email(to, subject, body):
    # No SMTP provider is configured for this project, so "sending" an email
    # just logs it — swap this for Flask-Mail (or similar) once real
    # credentials are available, without changing any caller.
    logger.info("EMAIL to=%s subject=%r body=%r", to, subject, body)
