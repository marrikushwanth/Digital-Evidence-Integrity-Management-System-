import uuid
from flask import g, request

def generate_request_id():
    """Generates a unique request ID and attaches it to the flask global object g."""
    if not hasattr(g, 'request_id'):
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))

def attach_request_id(response):
    """Attaches the request ID to the outgoing response headers."""
    if hasattr(g, 'request_id'):
        response.headers['X-Request-ID'] = g.request_id
    return response

def setup_request_id(app):
    app.before_request(generate_request_id)
    app.after_request(attach_request_id)
