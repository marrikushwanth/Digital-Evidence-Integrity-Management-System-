from flask import jsonify, g

def success_response(message="Success", data=None, status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data,
        "errors": None
    }), status_code

def error_response(message="Error", errors=None, status_code=400):
    response_body = {
        "success": False,
        "message": message,
        "data": None,
        "errors": errors
    }
    if hasattr(g, 'request_id'):
        response_body['request_id'] = g.request_id
    return jsonify(response_body), status_code
