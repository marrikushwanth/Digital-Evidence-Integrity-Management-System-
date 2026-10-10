from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per minute"],
    storage_uri="memory://"
)

@limiter.request_filter
def exempt_options():
    return request.method == 'OPTIONS'
