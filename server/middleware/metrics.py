import time
from flask import request, g

runtime_metrics = {
    'request_count': 0,
    'error_4xx_count': 0,
    'error_5xx_count': 0,
    'total_response_time_ms': 0,
    'response_count': 0
}

def setup_metrics(app):
    @app.before_request
    def start_timer():
        g.start_time = time.time()
        
    @app.after_request
    def record_metrics(response):
        runtime_metrics['request_count'] += 1
        runtime_metrics['response_count'] += 1
        
        if 400 <= response.status_code < 500:
            runtime_metrics['error_4xx_count'] += 1
        elif response.status_code >= 500:
            runtime_metrics['error_5xx_count'] += 1
            
        if hasattr(g, 'start_time'):
            elapsed = (time.time() - g.start_time) * 1000
            runtime_metrics['total_response_time_ms'] += elapsed
            
        return response
