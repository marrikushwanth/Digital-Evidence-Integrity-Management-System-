import os
from datetime import datetime

def send_security_notification(user, event_type, details):
    """
    Simulates sending a security notification to a user.
    In a production environment, this would integrate with an SMTP server or SMS provider.
    For local development, it logs securely to stdout or a simulated mailbox file.
    """
    if not user.email_notifications_enabled:
        return
        
    # Prevent sensitive information from being logged
    sensitive_keys = ['password', 'secret', 'token', 'code', 'jwt', 'hash', 'key']
    safe_details = {k: v for k, v in details.items() if not any(s in k.lower() for s in sensitive_keys)}
    
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    message = f"""
===================================================
[SECURITY NOTIFICATION]
To: {user.email}
Time: {timestamp}
Event: {event_type}

Hello {user.full_name},

A security event has been detected on your DEIMS account.

Details:
"""
    for key, value in safe_details.items():
        message += f"- {key}: {value}\n"
        
    message += """
If you did not authorize this action, please contact your Super Admin immediately.
===================================================
"""
    
    print(message)
    
    # Optional: Log to a simulated mailbox file for easy viewing during development
    log_dir = '.system_generated'
    os.makedirs(log_dir, exist_ok=True)
    
    try:
        with open(os.path.join(log_dir, 'notifications.log'), 'a') as f:
            f.write(message + '\n')
    except Exception:
        pass
