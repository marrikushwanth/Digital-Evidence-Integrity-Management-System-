import re
from functools import wraps
from flask import request
from utils.response import error_response

def validate_request(*expected_args):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return error_response('Request must be JSON', status_code=400)
            
            data = request.get_json()
            missing = [arg for arg in expected_args if arg not in data]
            if missing:
                return error_response(f'Missing required fields: {", ".join(missing)}', status_code=400)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None
