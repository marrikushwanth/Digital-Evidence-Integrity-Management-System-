import requests
from flask import request
from models.db import db
from models.security import SecurityEvent
from utils.logger import log_audit
import datetime

def get_client_ip(req):
    # Prefer X-Forwarded-For if available, otherwise fallback to remote_addr
    x_forwarded_for = req.headers.get('X-Forwarded-For')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return req.remote_addr

def get_ip_geolocation(ip_address):
    # Using a free service (ip-api.com) for IP geolocation. 
    # It returns JSON with country, region, city, lat, lon, isp, org, as
    if not ip_address or ip_address in ['127.0.0.1', '::1', 'localhost']:
        return {}
    
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}?fields=status,message,country,regionName,city,zip,lat,lon,isp,org,as,query", timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country"),
                    "region": data.get("regionName"),
                    "city": data.get("city"),
                    "postal_code": data.get("zip"),
                    "lat": data.get("lat"),
                    "lon": data.get("lon"),
                    "isp": data.get("isp"),
                    "org": data.get("org"),
                    "asn": data.get("as")
                }
    except Exception as e:
        print(f"Error fetching IP geolocation: {e}")
    return {}

def record_security_event(event_type, event_result, user_id=None, attempted_identifier=None, failure_reason=None, req=None, custom_data=None):
    if not req:
        from flask import request as flask_request
        req = flask_request
        
    ip_address = get_client_ip(req)
    
    # Check if we should fetch IP geolocation
    geo_data = get_ip_geolocation(ip_address)
    
    event = SecurityEvent(
        event_type=event_type,
        event_result=event_result,
        user_id=user_id,
        attempted_identifier=attempted_identifier,
        ip_address=ip_address,
        ip_version="IPv6" if ":" in ip_address else "IPv4" if ip_address else None,
        ip_country=geo_data.get("country"),
        ip_region=geo_data.get("region"),
        ip_city=geo_data.get("city"),
        ip_postal_code=geo_data.get("postal_code"),
        ip_latitude=geo_data.get("lat"),
        ip_longitude=geo_data.get("lon"),
        isp=geo_data.get("isp"),
        organization=geo_data.get("org"),
        asn=geo_data.get("asn"),
        
        browser=req.user_agent.browser if hasattr(req.user_agent, 'browser') else 'Unknown',
        browser_version=req.user_agent.version if hasattr(req.user_agent, 'version') else 'Unknown',
        operating_system=req.user_agent.platform if hasattr(req.user_agent, 'platform') else 'Unknown',
        device_type="Desktop",  # Fallback since is_mobile is deprecated in werkzeug
        user_agent=req.user_agent.string if hasattr(req.user_agent, 'string') else 'Unknown',
        
        failure_reason=failure_reason
    )
    
    if custom_data:
        if 'gps_latitude' in custom_data:
            event.gps_latitude = custom_data['gps_latitude']
        if 'gps_longitude' in custom_data:
            event.gps_longitude = custom_data['gps_longitude']
        if 'gps_accuracy' in custom_data:
            event.gps_accuracy = custom_data['gps_accuracy']
        if 'location_permission' in custom_data:
            event.location_permission = custom_data['location_permission']
        if 'mfa_result' in custom_data:
            event.mfa_result = custom_data['mfa_result']

    db.session.add(event)
    db.session.commit()
    return event
