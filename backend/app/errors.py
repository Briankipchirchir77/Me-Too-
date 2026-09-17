from flask import jsonify


class ApiError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify({"error": err.message}), err.status_code

    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return jsonify({"error": "Method not allowed."}), 405

    @app.errorhandler(429)
    def handle_rate_limited(err):
        return jsonify({"error": "Too many requests. Please try again shortly."}), 429

    @app.errorhandler(500)
    def handle_server_error(err):
        return jsonify({"error": "Something went wrong on our end."}), 500
